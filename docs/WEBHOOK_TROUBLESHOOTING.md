# Webhook Troubleshooting Guide

## Common Issues and Solutions

### Issue: "Webhook signature verification failed"

**Symptoms:**
- Function logs show: `Webhook signature verification failed`
- Webhook events not being processed

**Solutions:**

1. **Check Webhook Secret**
   - Ensure `STRIPE_WEBHOOK_SECRET` in Netlify matches the secret from Stripe Dashboard
   - Make sure you're using the correct secret for test/live mode

2. **Check Body Format**
   - Stripe requires raw body for signature verification
   - If using Netlify, the function should handle this automatically
   - If issues persist, check Netlify function logs for body format

3. **Verify Webhook URL**
   - URL must be: `https://your-site.netlify.app/.netlify/functions/stripe-webhook`
   - Must use HTTPS (not HTTP)
   - No trailing slash

### Issue: "Email not sending"

**Symptoms:**
- Order completes but no email received
- Function logs show email errors

**Solutions:**

1. **Check SendGrid API Key**
   - Verify `SENDGRID_API_KEY` is correct in Netlify
   - Key should start with `SG.`

2. **Verify Sender Email**
   - `SENDGRID_FROM_EMAIL` must be a verified sender in SendGrid
   - Check SendGrid Dashboard → Settings → Sender Authentication

3. **Check SendGrid Activity**
   - Go to SendGrid Dashboard → Activity
   - Look for failed sends and error messages

4. **Check Spam Folder**
   - Customer emails might be in spam
   - Consider using a custom domain for better deliverability

### Issue: "SMS not sending"

**Symptoms:**
- Order completes but no SMS received
- Function logs show SMS errors

**Solutions:**

1. **Check Twilio Credentials**
   - Verify `TWILIO_ACCOUNT_SID` starts with `AC`
   - Verify `TWILIO_AUTH_TOKEN` is correct
   - Verify `TWILIO_PHONE_NUMBER` includes country code (e.g., `+15551234567`)

2. **Check Phone Number Format**
   - Phone numbers must include country code
   - Format: `+1` for US, `+44` for UK, etc.
   - Function automatically formats, but verify input

3. **Check Twilio Account**
   - Ensure account has credits
   - Free trial includes $15.50
   - Check Twilio Console for errors

4. **Verify Phone Number**
   - Test with your own phone number first
   - Some numbers may be blocked or invalid

### Issue: "Webhook not triggering"

**Symptoms:**
- Orders complete but webhook never fires
- No function logs appear

**Solutions:**

1. **Check Webhook Endpoint in Stripe**
   - Go to Stripe Dashboard → Webhooks
   - Verify URL is correct
   - Check if endpoint is enabled

2. **Check Event Selection**
   - Must have `checkout.session.completed` selected
   - Can also add `payment_intent.succeeded` as backup

3. **Check Stripe Webhook Logs**
   - Go to Stripe Dashboard → Webhooks → Your endpoint
   - Click on endpoint to see delivery logs
   - Check for failed deliveries and error messages

4. **Test Webhook Manually**
   - In Stripe Dashboard → Webhooks → Your endpoint
   - Click "Send test webhook"
   - Select `checkout.session.completed`
   - Check Netlify function logs

### Issue: "Function timeout or errors"

**Symptoms:**
- Function logs show timeouts
- 500 errors in Stripe webhook logs

**Solutions:**

1. **Check Function Timeout**
   - Netlify Functions have 10s timeout on free tier
   - 26s timeout on paid plans
   - If emails/SMS take too long, consider async processing

2. **Check Dependencies**
   - Ensure all packages are installed
   - Run `npm install` in functions directory if needed

3. **Check Environment Variables**
   - All required variables must be set
   - Check Netlify Dashboard → Environment variables

### Issue: "Body parsing errors"

**Symptoms:**
- Function receives webhook but can't parse body
- Signature verification fails

**Solutions:**

1. **Netlify Body Handling**
   - Netlify should handle raw body automatically
   - If issues persist, check function logs for body format

2. **Alternative: Use Stripe CLI for Testing**
   ```bash
   stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook
   ```

## Testing Checklist

### Before Testing:
- [ ] All environment variables set in Netlify
- [ ] SendGrid sender verified
- [ ] Twilio phone number active
- [ ] Stripe webhook endpoint created
- [ ] Function deployed to Netlify

### Test Steps:
1. [ ] Place test order with test card `4242 4242 4242 4242`
2. [ ] Check Stripe Dashboard → Webhooks → Logs (should show success)
3. [ ] Check Netlify Functions → stripe-webhook → Logs
4. [ ] Check email inbox (and spam folder)
5. [ ] Check phone for SMS
6. [ ] Verify all logs show success messages

### Expected Log Messages:

**Success:**
```
Processing checkout session: cs_test_...
Confirmation email sent to: customer@email.com
Confirmation SMS sent to: +1234567890
Order completed: { orderNumber: '...', ... }
```

**Errors to Watch For:**
```
Webhook signature verification failed
SendGrid API key not configured
Twilio not configured
Failed to send email
Failed to send SMS
```

## Debugging Tips

### 1. Enable Detailed Logging

Add more console.log statements in the webhook function:
```javascript
console.log('Webhook received:', webhookEvent.type);
console.log('Session data:', JSON.stringify(session, null, 2));
```

### 2. Test Individual Services

**Test Email:**
```javascript
// Temporarily add to function
await sendConfirmationEmail({
    email: 'your-email@test.com',
    name: 'Test Customer',
    orderNumber: 'TEST123',
    items: [{ name: 'Test Item', quantity: 1, price: '10.00' }],
    subtotal: '10.00',
    shipping: '5.99',
    total: '15.99',
    shippingAddress: '123 Test St',
});
```

**Test SMS:**
```javascript
// Temporarily add to function
await sendConfirmationSMS({
    phone: '+1234567890', // Your phone
    orderNumber: 'TEST123',
    total: '15.99',
});
```

### 3. Check Service Dashboards

- **SendGrid**: Dashboard → Activity → Check for bounces, blocks, or errors
- **Twilio**: Console → Monitor → Logs → Check for failed messages
- **Stripe**: Dashboard → Webhooks → Your endpoint → Check delivery status

### 4. Use Stripe CLI for Local Testing

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local function
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook

# Trigger test event
stripe trigger checkout.session.completed
```

## Getting Help

If issues persist:

1. **Check all logs:**
   - Netlify function logs
   - Stripe webhook logs
   - SendGrid activity feed
   - Twilio console logs

2. **Verify configuration:**
   - All environment variables correct
   - All services active and verified
   - Webhook endpoint URL correct

3. **Test with minimal setup:**
   - Test email only (comment out SMS)
   - Test SMS only (comment out email)
   - Test webhook without notifications (just log)

4. **Contact support:**
   - SendGrid: support@sendgrid.com
   - Twilio: support@twilio.com
   - Stripe: support@stripe.com
   - Netlify: support@netlify.com

## Common Configuration Mistakes

1. ❌ Using test keys in production
2. ❌ Missing country code in phone numbers
3. ❌ Using unverified sender email
4. ❌ Wrong webhook secret (test vs live)
5. ❌ Incorrect webhook URL (missing `.netlify`)
6. ❌ Environment variables not set in Netlify
7. ❌ Forgetting to deploy after code changes

## Performance Optimization

If webhook processing is slow:

1. **Send emails/SMS asynchronously** (don't wait for response)
2. **Use queue system** (AWS SQS, etc.) for high volume
3. **Cache API connections** where possible
4. **Monitor function execution time** in Netlify

---

**Remember:** Always test in test mode first before going live!


