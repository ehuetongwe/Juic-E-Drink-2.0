// Netlify Serverless Function for Stripe Webhooks
// This function handles Stripe webhook events and sends confirmation emails/SMS

const stripe = require('stripe');
const sgMail = require('@sendgrid/mail');
const twilio = require('twilio');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
    // Stripe webhooks require raw body for signature verification
    const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];

    if (!sig) {
        console.error('Missing Stripe signature');
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing Stripe signature' }),
        };
    }

    // Check if webhook secret is configured
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        console.error('STRIPE_WEBHOOK_SECRET environment variable is not set');
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Webhook secret not configured' }),
        };
    }

    // Check if Stripe secret key is available
    if (!process.env.STRIPE_SECRET_KEY) {
        console.error('STRIPE_SECRET_KEY environment variable is not set');
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Stripe secret key not configured' }),
        };
    }

    // Initialize Stripe
    const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);

    let webhookEvent;

    try {
        // Verify webhook signature
        // Netlify passes body as string, but Stripe needs it as-is for signature verification
        // If body is already a string (JSON), we need to use it directly
        // If it's base64 encoded, decode it first
        let body = event.body;

        if (event.isBase64Encoded) {
            body = Buffer.from(event.body, 'base64').toString('utf-8');
        } else if (typeof event.body === 'string') {
            // Body is already a string - use it as-is for signature verification
            body = event.body;
        } else {
            // Body might be parsed as JSON, need to stringify it back
            body = JSON.stringify(event.body);
        }

        webhookEvent = stripeInstance.webhooks.constructEvent(
            body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return {
            statusCode: 400,
            body: JSON.stringify({ error: `Webhook Error: ${err.message}` }),
        };
    }

    // Handle the event
    try {
        switch (webhookEvent.type) {
            case 'checkout.session.completed':
                await handleCheckoutCompleted(webhookEvent.data.object);
                break;
            case 'payment_intent.succeeded':
                // This is a backup - checkout.session.completed is preferred
                console.log('PaymentIntent succeeded:', webhookEvent.data.object.id);
                break;
            default:
                console.log(`Unhandled event type: ${webhookEvent.type}`);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ received: true }),
        };
    } catch (error) {
        console.error('Error processing webhook:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to process webhook' }),
        };
    }
};

// Handle successful checkout
async function handleCheckoutCompleted(session) {
    console.log('Processing checkout session:', session.id);

    // Retrieve full session details including line items
    const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);
    const fullSession = await stripeInstance.checkout.sessions.retrieve(session.id, {
        expand: ['line_items'],
    });

    // Extract customer information
    const customerEmail = fullSession.customer_email || fullSession.customer_details?.email;
    const customerName = fullSession.metadata?.customer_name ||
        fullSession.customer_details?.name ||
        'Valued Customer';
    const customerPhone = fullSession.metadata?.customer_phone ||
        fullSession.customer_details?.phone;
    const shippingAddress = fullSession.metadata?.shipping_address ||
        (fullSession.shipping_details ?
            `${fullSession.shipping_details.address.line1}, ${fullSession.shipping_details.address.city}, ${fullSession.shipping_details.address.state} ${fullSession.shipping_details.address.postal_code}` :
            'Not provided');

    // Extract order details
    const lineItems = fullSession.line_items?.data || [];
    const orderItems = lineItems
        .filter(item => item.description !== 'Shipping') // Exclude shipping from item list
        .map(item => ({
            name: item.description || item.price_data?.product_data?.name || 'Item',
            quantity: item.quantity,
            price: (item.amount_total / 100).toFixed(2),
        }));

    const subtotal = lineItems
        .filter(item => item.description !== 'Shipping')
        .reduce((sum, item) => sum + item.amount_total, 0) / 100;

    const shipping = lineItems
        .find(item => item.description === 'Shipping')?.amount_total || 0;
    const shippingAmount = shipping / 100;

    const total = (fullSession.amount_total / 100).toFixed(2);
    const orderNumber = fullSession.id.substring(0, 8).toUpperCase();

    // ==========================================
    // Supabase Integration: Save Order Data
    // ==========================================
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
            const supabase = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_SERVICE_ROLE_KEY
            );

            // 1. Insert or get Customer (using email as unique identifier for lookup, but keeping id as PK)
            // A simple approach is to try inserting, if it exists (by email, but we don't have unique constraint on email yet)
            // Let's just insert the customer for now, or look them up if you want to avoid duplicates
            // Alternatively, since we don't have a UNIQUE constraint on email, we'll insert a new customer record per order
            // or find the first one that matches the email to link the order.

            let customerId;
            if (customerEmail) {
                // Try to find existing customer by email
                const { data: existingCustomers, error: searchError } = await supabase
                    .from('customers')
                    .select('id')
                    .eq('email', customerEmail)
                    .limit(1);

                if (searchError) throw searchError;

                if (existingCustomers && existingCustomers.length > 0) {
                    customerId = existingCustomers[0].id;
                } else {
                    // Create new customer
                    const { data: newCustomer, error: createError } = await supabase
                        .from('customers')
                        .insert([{
                            email: customerEmail,
                            name: customerName !== 'Valued Customer' ? customerName : null,
                            phone: customerPhone
                        }])
                        .select('id')
                        .single();

                    if (createError) throw createError;
                    customerId = newCustomer.id;
                }
            }

            // 2. Insert Order
            const { data: newOrder, error: orderError } = await supabase
                .from('orders')
                .insert([{
                    customer_id: customerId || null,
                    stripe_session_id: fullSession.id,
                    subtotal: subtotal,
                    shipping: shippingAmount,
                    total: total,
                    shipping_address: shippingAddress !== 'Not provided' ? shippingAddress : null
                }])
                .select('id')
                .single();

            if (orderError) throw orderError;

            // 3. Insert Order Items
            if (orderItems.length > 0) {
                const itemsToInsert = orderItems.map(item => ({
                    order_id: newOrder.id,
                    product_name: item.name,
                    quantity: item.quantity,
                    price: parseFloat(item.price)
                }));

                const { error: itemsError } = await supabase
                    .from('order_items')
                    .insert(itemsToInsert);

                if (itemsError) throw itemsError;
            }

            console.log('Successfully saved order to Supabase:', newOrder.id);
        } catch (dbError) {
            console.error('Failed to save to Supabase:', err.message || dbError);
            // We log the error but don't stop the email/SMS notifications
        }
    } else {
        console.warn('Supabase credentials not configured, skipping database insert');
    }
    // ==========================================

    // Send email confirmation
    if (customerEmail) {
        try {
            await sendConfirmationEmail({
                email: customerEmail,
                name: customerName,
                orderNumber,
                items: orderItems,
                subtotal: subtotal.toFixed(2),
                shipping: shippingAmount.toFixed(2),
                total,
                shippingAddress,
            });
            console.log('Confirmation email sent to:', customerEmail);
        } catch (error) {
            console.error('Failed to send email:', error);
            // Don't fail the webhook if email fails
        }
    }

    // Send SMS confirmation
    if (customerPhone) {
        try {
            await sendConfirmationSMS({
                phone: customerPhone,
                orderNumber,
                total,
            });
            console.log('Confirmation SMS sent to:', customerPhone);
        } catch (error) {
            console.error('Failed to send SMS:', error);
            // Don't fail the webhook if SMS fails
        }
    }

    // Log order for your records (you can extend this to save to a database)
    console.log('Order completed:', {
        orderNumber,
        customerEmail,
        customerName,
        total,
        items: orderItems.length,
    });
}

// Send confirmation email using SendGrid
async function sendConfirmationEmail({ email, name, orderNumber, items, subtotal, shipping, total, shippingAddress }) {
    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY) {
        console.warn('SendGrid API key not configured, skipping email');
        return;
    }

    if (!process.env.SENDGRID_FROM_EMAIL) {
        console.warn('SendGrid from email not configured, skipping email');
        return;
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const itemsList = items.map(item =>
        `${item.name} × ${item.quantity} - $${item.price}`
    ).join('\n');

    const emailContent = {
        to: email,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: `Order Confirmation - ${orderNumber} | Juic'E Drinks`,
        text: `
Thank you for your order, ${name}!

Order Number: ${orderNumber}

Items:
${itemsList}

Subtotal: $${subtotal}
Shipping: $${shipping}
Total: $${total}

Shipping Address:
${shippingAddress}

Your order is being processed and will be shipped within 3-5 business days.

Thank you for choosing Juic'E Drinks!

Best regards,
The Juic'E Drinks Team
        `.trim(),
        html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .order-number { font-size: 24px; font-weight: bold; color: #667eea; margin: 20px 0; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .items-table th, .items-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .items-table th { background-color: #667eea; color: white; }
        .total { font-size: 18px; font-weight: bold; margin-top: 20px; text-align: right; }
        .shipping-info { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🍹 Thank You for Your Order!</h1>
        </div>
        <div class="content">
            <p>Hi ${name},</p>
            <p>We've received your order and are preparing it for shipment!</p>
            
            <div class="order-number">Order #${orderNumber}</div>
            
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Price</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.quantity}</td>
                            <td>$${item.price}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="total">
                <div>Subtotal: $${subtotal}</div>
                <div>Shipping: $${shipping}</div>
                <div style="font-size: 22px; margin-top: 10px;">Total: $${total}</div>
            </div>
            
            <div class="shipping-info">
                <strong>Shipping Address:</strong><br>
                ${shippingAddress}
            </div>
            
            <p>Your order will be processed and shipped within <strong>3-5 business days</strong>. You'll receive a tracking number once your order ships.</p>
            
            <p>If you have any questions, please don't hesitate to contact us.</p>
            
            <div class="footer">
                <p>Thank you for choosing Juic'E Drinks!</p>
                <p>Best regards,<br>The Juic'E Drinks Team</p>
            </div>
        </div>
    </div>
</body>
</html>
        `.trim(),
    };

    await sgMail.send(emailContent);
}

// Send confirmation SMS using Twilio
async function sendConfirmationSMS({ phone, orderNumber, total }) {
    // Check if Twilio is configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
        console.warn('Twilio not configured, skipping SMS');
        return;
    }

    // Clean phone number (remove non-digits, ensure it starts with +)
    let cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone.startsWith('1') && cleanPhone.length === 10) {
        cleanPhone = '1' + cleanPhone; // Add US country code
    }
    if (!cleanPhone.startsWith('+')) {
        cleanPhone = '+' + cleanPhone;
    }

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    const message = await client.messages.create({
        body: `🍹 Juic'E Drinks: Thank you for your order! Order #${orderNumber} for $${total} has been confirmed. We'll ship within 3-5 business days.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: cleanPhone,
    });

    return message;
}

