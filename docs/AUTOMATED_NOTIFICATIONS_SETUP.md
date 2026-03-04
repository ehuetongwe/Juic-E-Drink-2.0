# Automated Email & SMS Notifications Setup Guide

This guide will help you set up automated confirmation emails and SMS messages that are sent to customers after they complete a purchase.

## Overview

When a customer completes a purchase through Stripe Checkout, the system will automatically:
1. ✅ Send a confirmation email with order details
2. ✅ Send a confirmation SMS text message
3. ✅ Log the order for your records

## Architecture

```
Customer Payment → Stripe Checkout → Stripe Webhook → Your Netlify Function
                                                          ↓
                                    ┌─────────────────────┴─────────────────────┐
                                    ↓                                           ↓
                            SendGrid Email API                          Twilio SMS API
                                    ↓                                           ↓
                            Customer Email                            Customer Phone
```

## Prerequisites

- ✅ Stripe account with webhook capability
- ✅ Netlify account (for hosting)
- ✅ SendGrid account (for emails) - Free tier available
- ✅ Twilio account (for SMS) - Free trial available

---

## Step 1: Set Up SendGrid (Email Service)

### 1.1 Create SendGrid Account

1. Go to [https://sendgrid.com](https://sendgrid.com)
2. Sign up for a free account (100 emails/day free)
3. Verify your email address

### 1.2 Create API Key

1. In SendGrid Dashboard, go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Name it: `JuicE Drinks Webhook`
4. Select **Full Access** (or at minimum: **Mail Send** permissions)
5. Click **Create & View**
6. **IMPORTANT**: Copy the API key immediately (you won't see it again!)
   - It will look like: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 1.3 Verify Sender Identity

1. Go to **Settings** → **Sender Authentication**
2. Choose one of these options:
   - **Single Sender Verification** (easiest for testing)
     - Click **Create New Sender**
     - Enter your business email (e.g., `support@juicedrinks.biz`)
     - Fill in all required fields
     - Verify the email by clicking the link sent to your inbox
   - **Domain Authentication** (recommended for production)
     - Follow SendGrid's domain verification process
     - Add DNS records to your domain

### 1.4 Note Your From Email

- Use the verified sender email address
- Example: `support@juicedrinks.biz` or `noreply@juicedrinks.biz`

---

## Step 2: Set Up Twilio (SMS Service)

### 2.1 Create Twilio Account

1. Go to [https://www.twilio.com](https://www.twilio.com)
2. Sign up for a free trial account
3. Verify your phone number

### 2.2 Get Your Credentials

1. In Twilio Console Dashboard, you'll see:
   - **Account SID**: Starts with `AC...`
   - **Auth Token**: Click "View" to reveal it
2. Copy both values

### 2.3 Get a Phone Number

1. Go to **Phone Numbers** → **Manage** → **Buy a number**
2. Select a US phone number (or your country)
3. Click **Buy** (free trial includes a number)
4. Note the phone number (e.g., `+1234567890`)

### 2.4 Note Your Twilio Phone Number

- Format: `+1234567890` (include country code with +)
- This is the number that will send SMS to your customers

---

## Step 3: Configure Stripe Webhooks

### 3.1 Get Your Webhook Secret

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **Webhooks**
3. Click **Add endpoint**
4. Enter your webhook URL:
   ```
   https://your-site.netlify.app/.netlify/functions/stripe-webhook
   ```
   Replace `your-site` with your actual Netlify site name
5. Select events to listen for:
   - ✅ `checkout.session.completed` (required)
   - ✅ `payment_intent.succeeded` (optional backup)
6. Click **Add endpoint**
7. After creating, click on the endpoint to view details
8. Click **Reveal** next to "Signing secret"
9. Copy the webhook secret (starts with `whsec_...`)

### 3.2 Test Webhook (Optional)

1. In Stripe Dashboard → Webhooks → Your endpoint
2. Click **Send test webhook**
3. Select `checkout.session.completed`
4. Click **Send test webhook**
5. Check your Netlify function logs to see if it received the event

---

## Step 4: Configure Netlify Environment Variables

### 4.1 Add Environment Variables in Netlify

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Click **Add a variable**
4. Add the following variables:

#### Required Variables:

| Variable Name | Value | Where to Get It |
|--------------|-------|----------------|
| `STRIPE_SECRET_KEY` | `sk_test_...` or `sk_live_...` | Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Stripe Dashboard → Developers → Webhooks → Your endpoint |
| `SENDGRID_API_KEY` | `SG.xxx...` | SendGrid Dashboard → Settings → API Keys |
| `SENDGRID_FROM_EMAIL` | `support@juicedrinks.biz` | Your verified SendGrid sender email |
| `TWILIO_ACCOUNT_SID` | `ACxxx...` | Twilio Console Dashboard |
| `TWILIO_AUTH_TOKEN` | `xxx...` | Twilio Console Dashboard (click View) |
| `TWILIO_PHONE_NUMBER` | `+1234567890` | Your Twilio phone number |

### 4.2 Set Variables for Different Environments

- **Production**: Set in **Site settings** → **Environment variables** → **Production**
- **Deploy previews**: Variables are inherited from production by default

### 4.3 Example Configuration

```
STRIPE_SECRET_KEY=sk_live_51RkExhJyOFzlYZ85...
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=support@juicedrinks.biz
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+15551234567
```

---

## Step 5: Install Dependencies

The required packages are already in `package.json`. If deploying locally or testing:

```bash
npm install
```

This installs:
- `stripe` - Stripe SDK
- `@sendgrid/mail` - SendGrid email service
- `twilio` - Twilio SMS service

---

## Step 6: Deploy to Netlify

### 6.1 Deploy Your Site

1. Push your code to GitHub/GitLab/Bitbucket
2. Netlify will automatically deploy
3. Or manually deploy via Netlify CLI:
   ```bash
   netlify deploy --prod
   ```

### 6.2 Verify Deployment

1. Check that your function is deployed:
   - Go to **Functions** tab in Netlify dashboard
   - You should see `stripe-webhook` listed
2. Test the webhook endpoint:
   ```bash
   curl https://your-site.netlify.app/.netlify/functions/stripe-webhook
   ```
   Should return an error about missing signature (this is expected - it means the function is working)

---

## Step 7: Test the Integration

### 7.1 Test with Stripe Test Mode

1. Make sure you're using **test mode** in Stripe Dashboard
2. Use test keys in Netlify environment variables:
   - `STRIPE_SECRET_KEY` should start with `sk_test_`
3. Place a test order on your website:
   - Use test card: `4242 4242 4242 4242`
   - Use a real email address you can check
   - Use a real phone number you can check
4. Complete the checkout
5. Check:
   - ✅ Your email inbox for confirmation email
   - ✅ Your phone for SMS confirmation
   - ✅ Netlify function logs (Functions → stripe-webhook → Logs)

### 7.2 Check Function Logs

1. In Netlify Dashboard → **Functions** → `stripe-webhook`
2. Click **View logs**
3. Look for:
   - `Processing checkout session: cs_test_...`
   - `Confirmation email sent to: customer@email.com`
   - `Confirmation SMS sent to: +1234567890`
   - `Order completed: {...}`

### 7.3 Troubleshooting

**Email not sending?**
- Check SendGrid API key is correct
- Verify sender email is verified in SendGrid
- Check SendGrid activity feed for errors
- Check Netlify function logs for error messages

**SMS not sending?**
- Check Twilio credentials are correct
- Verify phone number format includes country code (e.g., `+15551234567`)
- Check Twilio console for error messages
- Ensure Twilio account has credits (free trial has $15.50)

**Webhook not triggering?**
- Verify webhook URL in Stripe matches your Netlify function URL
- Check webhook secret is correct
- Ensure `checkout.session.completed` event is selected
- Check Stripe webhook logs in Stripe Dashboard

---

## Step 8: Go Live (Production)

### 8.1 Switch to Live Mode

1. In Stripe Dashboard, switch to **Live mode**
2. Get your **live** API keys:
   - `STRIPE_SECRET_KEY` → `sk_live_...`
3. Create a **live** webhook endpoint:
   - URL: `https://your-site.netlify.app/.netlify/functions/stripe-webhook`
   - Events: `checkout.session.completed`
   - Copy the **live** webhook secret: `whsec_...`
4. Update Netlify environment variables with live keys
5. Redeploy your site

### 8.2 Verify Production Setup

1. Test with a small real purchase (you can refund it)
2. Verify email and SMS are sent
3. Monitor function logs for any errors

---

## Customization

### Customize Email Template

Edit the `sendConfirmationEmail` function in `netlify/functions/stripe-webhook.js`:

- Modify the HTML template
- Change email subject
- Add your logo
- Customize styling

### Customize SMS Message

Edit the `sendConfirmationSMS` function in `netlify/functions/stripe-webhook.js`:

- Change the message text
- Add order details
- Include tracking information

### Add More Notifications

You can extend the webhook handler to:
- Send shipping updates
- Send delivery confirmations
- Send order status changes
- Notify you (the business owner) of new orders

---

## Cost Estimates

### SendGrid
- **Free tier**: 100 emails/day forever
- **Essentials**: $19.95/month for 50,000 emails
- **Pro**: $89.95/month for 100,000 emails

### Twilio
- **SMS in US**: ~$0.0075 per message
- **Free trial**: $15.50 credit (good for ~2,000 messages)
- Example: 1,000 orders/month = ~$7.50/month

### Netlify Functions
- **Free tier**: 125,000 requests/month
- **Pro**: $19/month for 500,000 requests

**Total estimated cost for small business**: ~$0-30/month

---

## Security Best Practices

1. ✅ **Never commit API keys to Git**
   - All secrets should be in Netlify environment variables only
2. ✅ **Use different keys for test and production**
   - Keep test and live keys separate
3. ✅ **Rotate keys periodically**
   - Update API keys every 90 days
4. ✅ **Monitor usage**
   - Check SendGrid and Twilio dashboards for unusual activity
5. ✅ **Verify webhook signatures**
   - The code already does this - don't disable it!

---

## Support & Resources

### Documentation
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [SendGrid API](https://docs.sendgrid.com/api-reference)
- [Twilio SMS API](https://www.twilio.com/docs/sms)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)

### Getting Help
- Check function logs in Netlify Dashboard
- Check SendGrid activity feed
- Check Twilio console for SMS logs
- Check Stripe Dashboard → Webhooks → Your endpoint → Logs

---

## Quick Reference Checklist

- [ ] SendGrid account created and verified
- [ ] SendGrid API key created
- [ ] Twilio account created
- [ ] Twilio phone number purchased
- [ ] Stripe webhook endpoint created
- [ ] Webhook secret copied
- [ ] All environment variables set in Netlify
- [ ] Site deployed to Netlify
- [ ] Test order completed successfully
- [ ] Email received
- [ ] SMS received
- [ ] Function logs show success
- [ ] Production keys configured (when going live)

---

## Next Steps

After setting up automated notifications, consider:

1. **Order Management System**: Store orders in a database
2. **Inventory Tracking**: Update stock levels automatically
3. **Shipping Integration**: Send tracking numbers via email/SMS
4. **Customer Portal**: Let customers view order history
5. **Analytics**: Track order completion rates and customer satisfaction

---

**Need help?** Check the function logs first, then refer to the service-specific documentation links above.


