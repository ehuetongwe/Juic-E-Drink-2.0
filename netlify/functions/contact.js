const sgMail = require('@sendgrid/mail');

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
        console.error('SendGrid environment variables are missing');
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Email service is not configured properly' }),
        };
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    try {
        let payload;

        // Handle URL-encoded body (which our frontend uses via URLSearchParams)
        if (event.headers['content-type'] && event.headers['content-type'].includes('application/x-www-form-urlencoded')) {
            const params = new URLSearchParams(event.body);
            payload = Object.fromEntries(params);
        } else {
            // Fallback for JSON
            payload = JSON.parse(event.body);
        }

        const { name, email, message, 'bot-field': botField } = payload;

        // Simple honeypot check (if bot-field has a value, silently reject)
        if (botField) {
            console.log('Spam detected via honeypot');
            return {
                statusCode: 200, // Return success to fool the bot
                body: JSON.stringify({ success: true }),
            };
        }

        // Validate required fields
        if (!name || !email || !message) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields' }),
            };
        }

        // Prepare the email
        const emailContent = {
            to: process.env.SENDGRID_FROM_EMAIL, // Send TO the business owner
            from: process.env.SENDGRID_FROM_EMAIL, // Must send FROM the verified sender
            replyTo: email, // If the owner replies, it goes to the customer
            subject: `New Contact Form Message from ${name}`,
            text: `
You have received a new message from the Juic'E Drinks website contact form:

Name: ${name}
Email: ${email}

Message:
${message}
            `.trim(),
            html: `
<div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
    <div style="background-color: #2F7C4C; color: white; padding: 20px; text-align: center;">
        <h2 style="margin: 0;">New Contact Form Message</h2>
    </div>
    <div style="padding: 20px; background-color: #ffffff;">
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p><strong>Message:</strong></p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; white-space: pre-wrap;">${message}</div>
    </div>
    <div style="background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 12px; color: #666;">
        <p>This message was sent from the Juic'E Drinks website contact form.</p>
    </div>
</div>
            `.trim(),
        };

        // Send the email
        await sgMail.send(emailContent);
        console.log(`Contact form email sent successfully for ${email}`);

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'Message sent successfully' }),
        };
    } catch (error) {
        console.error('Error processing contact form:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to send message' }),
        };
    }
};
