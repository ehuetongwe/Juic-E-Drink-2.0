# Stripe Payment Integration Setup Guide

This guide will help you set up **Stripe Checkout** for your Juic'E Drinks website. Stripe Checkout is the recommended approach as it's the easiest, most secure, and PCI-compliant solution.

## Why Stripe Checkout?

✅ **Easiest to implement** - Minimal code required  
✅ **Most secure** - PCI compliant, handles all card data securely  
✅ **Better conversion** - Optimized checkout experience  
✅ **Supports all payment methods** - Cards, Apple Pay, Google Pay, etc.  
✅ **Mobile optimized** - Works perfectly on all devices  

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. A backend server (Node.js, Python, PHP, etc.) to securely handle payment processing
3. Your Stripe API keys

## Step 1: Get Your Stripe Keys

1. Log in to your Stripe Dashboard
2. Go to **Developers** → **API keys**
3. Copy your **Publishable key** (starts with `pk_`)
4. Copy your **Secret key** (starts with `sk_`) - Keep this secret!

## Step 2: Update Frontend Code

In `script.js`, replace the placeholder Stripe key:

```javascript
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51YourPublishableKeyHere'; // Replace with your actual key
```

Replace `pk_test_51YourPublishableKeyHere` with your actual Stripe publishable key (starts with `pk_test_` for test mode or `pk_live_` for live mode).

## Step 3: Create Backend Endpoint

You need to create a backend endpoint that creates a Stripe Checkout Session. The frontend code is already set up to call `/api/create-checkout-session`.

### Option 1: Node.js/Express Backend (Recommended)

See `server-example.js` in this directory for a complete example. Here's the key endpoint:

```javascript
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { lineItems, shippingInfo, successUrl, cancelUrl } = req.body;
    
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
    });
    
    res.json({ sessionId: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**To run:**
1. Install dependencies: `npm install express stripe`
2. Copy `server-example.js` and update with your secret key
3. Run: `node server-example.js`

### Option 2: Python/Flask Backend

See `server-example-python.py` in this directory for a complete example.

**To run:**
1. Install dependencies: `pip install flask stripe flask-cors`
2. Copy `server-example-python.py` and update with your secret key
3. Run: `python server-example-python.py`

## Step 4: Frontend is Already Configured! ✅

The frontend code in `script.js` is already set up to use Stripe Checkout. It will:
1. Collect shipping information from your checkout form
2. Call your backend at `/api/create-checkout-session`
3. Redirect customers to Stripe's secure checkout page
4. Handle success/cancel redirects automatically

**No changes needed** - just make sure your backend endpoint matches the expected format!

## Step 5: Test Your Integration

1. Start your backend server (see Step 3)

2. Open your website and test the checkout flow:
   - Add items to cart
   - Click "Proceed to Checkout"
   - Fill out shipping information
   - Click "Proceed to Secure Checkout"
   - You'll be redirected to Stripe's checkout page

3. Use Stripe's test card numbers on the checkout page:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - Use any future expiry date (e.g., 12/34)
   - Use any 3-digit CVC
   - Use any ZIP code

4. After successful payment, you'll be redirected back to your site with `?success=true` in the URL

## Step 6: Handle Webhooks (Recommended)

Webhooks allow Stripe to notify your server when payments are completed. This is important for:
- Confirming orders in your database
- Sending confirmation emails
- Handling edge cases

1. In Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhook`
3. Select events: `checkout.session.completed` and `payment_intent.succeeded`
4. Copy the webhook signing secret
5. Update your backend with the webhook secret (see server examples)

## Step 7: Go Live

When you're ready to accept real payments:

1. Switch to **Live mode** in your Stripe Dashboard
2. Get your **live** publishable and secret keys (starts with `pk_live_` and `sk_live_`)
3. Update your code with the live keys:
   - Frontend: Update `STRIPE_PUBLISHABLE_KEY` in `script.js`
   - Backend: Update Stripe secret key in your server
4. Deploy your backend to a production server (Heroku, AWS, etc.)
5. Update webhook endpoint URL in Stripe Dashboard
6. Test with a real card (you can refund test payments)

## Security Notes

- ✅ **Never** expose your secret key in frontend code (only publishable key goes in `script.js`)
- ✅ Always use HTTPS in production
- ✅ Validate all input on the backend
- ✅ Implement webhooks to handle payment confirmations (see Step 6)
- ✅ Store order information in a database after successful payment
- ✅ Stripe Checkout handles all PCI compliance automatically - you never touch card data!

## How Stripe Checkout Works

1. Customer fills out shipping info on your site
2. Your backend creates a Checkout Session
3. Customer is redirected to Stripe's secure checkout page
4. Customer enters payment details (handled securely by Stripe)
5. After payment, customer is redirected back to your site
6. Your webhook receives confirmation (optional but recommended)

## Additional Resources

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Checkout Customization](https://stripe.com/docs/payments/checkout/customization)
- [Stripe API Reference](https://stripe.com/docs/api)

## Quick Start Checklist

- [ ] Create Stripe account
- [ ] Get publishable key and add to `script.js`
- [ ] Get secret key and add to backend
- [ ] Set up backend server (use `server-example.js` or `server-example-python.py`)
- [ ] Test checkout flow with test card
- [ ] Set up webhooks (optional but recommended)
- [ ] Test webhook handling
- [ ] Switch to live mode when ready
- [ ] Deploy to production

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check your backend server logs
3. Review Stripe Dashboard → Logs for API errors
4. Consult Stripe's documentation and support

