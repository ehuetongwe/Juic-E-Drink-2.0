const { schedule } = require('@netlify/functions');
const { createClient } = require('@supabase/supabase-js');
const sgMail = require('@sendgrid/mail');

const handler = async function (event, context) {
    console.log("Starting production digest...");

    // Check environment variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("Missing Supabase credentials");
        return { statusCode: 500, body: "Missing DB config" };
    }

    if (!process.env.SENDGRID_API_KEY || !process.env.BUSINESS_INBOX_EMAIL || !process.env.SENDGRID_FROM_EMAIL) {
        console.error("Missing SendGrid or Email credentials");
        return { statusCode: 500, body: "Missing Email config" };
    }

    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Fetch order items from unfulfilled orders
        // For now, we assume all orders in the DB are for the current drop
        // You might want to add a 'status' or 'drop_date' filter later
        console.log("Fetching order items...");
        const { data: orderItems, error } = await supabase
            .from('order_items')
            .select('*');

        if (error) throw error;

        if (!orderItems || orderItems.length === 0) {
            console.log("No orders found.");
            await sendEmailDigest("No orders yet for this drop.", "0");
            return { statusCode: 200, body: "No orders" };
        }

        // Aggregate quantities by product name
        const totals = {};
        let totalBottles = 0;

        orderItems.forEach(item => {
            const name = item.product_name;
            const qty = parseInt(item.quantity, 10) || 0;

            if (totals[name]) {
                totals[name] += qty;
            } else {
                totals[name] = qty;
            }
            totalBottles += qty;
        });

        console.log("Aggregated totals:", totals);

        // Format email body
        let itemsHtml = '';
        for (const [product, count] of Object.entries(totals)) {
            itemsHtml += `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>${product}</strong></td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${count}</td>
                </tr>
            `;
        }

        await sendEmailDigest(itemsHtml, totalBottles);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Digest sent successfully", totals })
        };

    } catch (error) {
        console.error("Error generating digest:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};

async function sendEmailDigest(itemsHtml, totalBottles) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2>🍹 Juic'E Drinks Production Digest</h2>
            <p>Here is your prep list based on current pre-orders.</p>
        </div>
        <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
            <h3>Total Bottles to Prep: <span style="color: #4CAF50;">${totalBottles}</span></h3>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <thead>
                    <tr>
                        <th style="text-align: left; padding: 10px; background-color: #f9f9f9; border-bottom: 2px solid #ddd;">Juice Flavor / Package</th>
                        <th style="text-align: right; padding: 10px; background-color: #f9f9f9; border-bottom: 2px solid #ddd;">Quantity (Bottles)</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml !== "No orders yet for this drop." ? itemsHtml : '<tr><td colspan="2" style="padding: 20px; text-align: center;">No orders yet.</td></tr>'}
                </tbody>
            </table>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
                <em>This is an automated report generated from your unfulfilled Supabase orders.</em>
            </p>
        </div>
    </div>
    `;

    const msg = {
        to: process.env.BUSINESS_INBOX_EMAIL,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: `Juic'E Drinks Prep List (${new Date().toLocaleDateString()})`,
        html: emailHtml,
    };

    console.log("Sending email to:", process.env.BUSINESS_INBOX_EMAIL);
    await sgMail.send(msg);
    console.log("Email sent successfully!");
}

// Schedule this to run every Friday at 8:00 AM UTC (adjust cron as needed)
// Cron format: 'Minute Hour DayOfMonth Month DayOfWeek'
exports.handler = schedule('0 8 * * 5', handler);
