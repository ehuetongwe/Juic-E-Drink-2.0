// Netlify Serverless Function for Stripe Checkout Session
// This function creates a Stripe Checkout Session when called from the frontend

exports.handler = async (event, context) => {
    // CORS headers for all responses
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };

    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: '',
        };
    }

    // Check if Stripe secret key is available
    if (!process.env.STRIPE_SECRET_KEY) {
        console.error('STRIPE_SECRET_KEY environment variable is not set');
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Server configuration error: Stripe secret key not found' 
            }),
        };
    }

    // Initialize Stripe
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    try {
        // Parse the request body
        const requestBody = JSON.parse(event.body);
        const { lineItems, shippingInfo, successUrl, cancelUrl } = requestBody;

        // Validate required data
        if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
            console.error('Validation error: Line items missing or empty', { lineItems });
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Line items are required' }),
            };
        }

        if (!shippingInfo || !shippingInfo.email) {
            console.error('Validation error: Shipping info missing or email missing', { shippingInfo });
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Shipping information with email is required' }),
            };
        }

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: successUrl || `${event.headers.referer || event.headers.origin}?success=true`,
            cancel_url: cancelUrl || `${event.headers.referer || event.headers.origin}?canceled=true`,
            customer_email: shippingInfo.email,
            shipping_address_collection: {
                allowed_countries: ['US'],
            },
            metadata: {
                customer_name: `${shippingInfo.firstName || ''} ${shippingInfo.lastName || ''}`.trim(),
                customer_phone: shippingInfo.phone || '',
                shipping_address: `${shippingInfo.address || ''}, ${shippingInfo.city || ''}, ${shippingInfo.state || ''} ${shippingInfo.zipCode || ''}`.trim(),
            },
            // Shipping option
            shipping_options: [
                {
                    shipping_rate_data: {
                        type: 'fixed_amount',
                        fixed_amount: {
                            amount: 599, // $5.99 in cents
                            currency: 'usd',
                        },
                        display_name: 'Standard Shipping',
                        delivery_estimate: {
                            minimum: {
                                unit: 'business_day',
                                value: 3,
                            },
                            maximum: {
                                unit: 'business_day',
                                value: 5,
                            },
                        },
                    },
                },
            ],
        });

        // Return the session ID
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ sessionId: session.id }),
        };
    } catch (error) {
        // Log detailed error information
        console.error('Error creating checkout session:', {
            message: error.message,
            type: error.type,
            code: error.code,
            stack: error.stack,
            requestBody: event.body ? JSON.parse(event.body) : null,
        });
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: error.message || 'Failed to create checkout session',
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            }),
        };
    }
};

