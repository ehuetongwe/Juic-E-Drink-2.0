// Example Backend Server for Stripe Checkout Integration
// This is a Node.js/Express example - adapt for your preferred backend framework

const express = require('express');
const stripe = require('stripe')('sk_test_YOUR_SECRET_KEY'); // Replace with your Stripe secret key
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// CORS middleware (if needed for cross-origin requests)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Create Checkout Session endpoint
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { lineItems, shippingInfo, successUrl, cancelUrl } = req.body;

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: successUrl,
            cancel_url: cancelUrl,
            customer_email: shippingInfo.email,
            shipping_address_collection: {
                allowed_countries: ['US'],
            },
            metadata: {
                customer_name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
                customer_phone: shippingInfo.phone,
                shipping_address: `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.state} ${shippingInfo.zipCode}`,
            },
            // Optional: Pre-fill shipping address
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

        res.json({ sessionId: session.id });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: error.message });
    }
});

// Webhook endpoint to handle payment completion (optional but recommended)
// You'll need to configure this in your Stripe Dashboard
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = 'whsec_YOUR_WEBHOOK_SECRET'; // Get from Stripe Dashboard

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            // Payment was successful, save order to database
            console.log('Payment successful for session:', session.id);
            // TODO: Save order to database, send confirmation email, etc.
            break;
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log('PaymentIntent succeeded:', paymentIntent.id);
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Make sure to:');
    console.log('1. Replace sk_test_YOUR_SECRET_KEY with your actual Stripe secret key');
    console.log('2. Update the webhook secret if using webhooks');
    console.log('3. Update successUrl and cancelUrl in your frontend code');
});

