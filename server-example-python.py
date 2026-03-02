# Example Backend Server for Stripe Checkout Integration (Python/Flask)
# Install dependencies: pip install flask stripe

from flask import Flask, request, jsonify
from flask_cors import CORS
import stripe

app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

# Initialize Stripe with your secret key
stripe.api_key = 'sk_test_YOUR_SECRET_KEY'  # Replace with your Stripe secret key

@app.route('/api/create-checkout-session', methods=['POST'])
def create_checkout_session():
    try:
        data = request.json
        line_items = data['lineItems']
        shipping_info = data['shippingInfo']
        success_url = data['successUrl']
        cancel_url = data['cancelUrl']
        
        # Create Checkout Session
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=line_items,
            mode='payment',
            success_url=success_url,
            cancel_url=cancel_url,
            customer_email=shipping_info['email'],
            shipping_address_collection={
                'allowed_countries': ['US'],
            },
            metadata={
                'customer_name': f"{shipping_info['firstName']} {shipping_info['lastName']}",
                'customer_phone': shipping_info['phone'],
                'shipping_address': f"{shipping_info['address']}, {shipping_info['city']}, {shipping_info['state']} {shipping_info['zipCode']}",
            },
            shipping_options=[{
                'shipping_rate_data': {
                    'type': 'fixed_amount',
                    'fixed_amount': {
                        'amount': 599,  # $5.99 in cents
                        'currency': 'usd',
                    },
                    'display_name': 'Standard Shipping',
                    'delivery_estimate': {
                        'minimum': {
                            'unit': 'business_day',
                            'value': 3,
                        },
                        'maximum': {
                            'unit': 'business_day',
                            'value': 5,
                        },
                    },
                },
            }],
        )
        
        return jsonify({'sessionId': session.id})
    except Exception as e:
        print(f'Error creating checkout session: {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/webhook', methods=['POST'])
def webhook():
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature')
    webhook_secret = 'whsec_YOUR_WEBHOOK_SECRET'  # Get from Stripe Dashboard
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except ValueError:
        return 'Invalid payload', 400
    except stripe.error.SignatureVerificationError:
        return 'Invalid signature', 400
    
    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        print(f'Payment successful for session: {session.id}')
        # TODO: Save order to database, send confirmation email, etc.
    elif event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        print(f'PaymentIntent succeeded: {payment_intent.id}')
    
    return jsonify({'received': True})

if __name__ == '__main__':
    print('Server running on http://localhost:3000')
    print('Make sure to:')
    print('1. Replace sk_test_YOUR_SECRET_KEY with your actual Stripe secret key')
    print('2. Update the webhook secret if using webhooks')
    print('3. Update successUrl and cancelUrl in your frontend code')
    app.run(port=3000, debug=True)

