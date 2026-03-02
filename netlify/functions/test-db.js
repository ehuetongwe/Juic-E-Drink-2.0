// Test Webhook for Supabase Integration
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
    console.log('Test Webhook Hit!');

    // Mock Data that normally comes from Stripe
    const fullSession = { id: 'cs_test_mock_12345' };
    const customerEmail = 'integration-test@example.com';
    const customerName = 'Integration Test User';
    const customerPhone = '+15550001111';
    const shippingAddress = '456 Test Blvd, Apt 4, Test City, TS 67890';

    const subtotal = 15.00;
    const shippingAmount = 5.99;
    const total = 20.99;

    const orderItems = [
        { name: 'The Refresher - Medium', quantity: 2, price: 5.00 },
        { name: 'The Reboot - Small', quantity: 1, price: 5.00 }
    ];

    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
            console.log('Attempting to connect to Supabase...');
            const supabase = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_SERVICE_ROLE_KEY
            );

            // 1. Insert Customer
            let customerId;
            console.log('Inserting/Finding Customer...');
            const { data: existingCustomers, error: searchError } = await supabase
                .from('customers')
                .select('id')
                .eq('email', customerEmail)
                .limit(1);

            if (searchError) throw searchError;

            if (existingCustomers && existingCustomers.length > 0) {
                customerId = existingCustomers[0].id;
            } else {
                const { data: newCustomer, error: createError } = await supabase
                    .from('customers')
                    .insert([{
                        email: customerEmail,
                        name: customerName,
                        phone: customerPhone
                    }])
                    .select('id')
                    .single();

                if (createError) throw createError;
                customerId = newCustomer.id;
            }

            // 2. Insert Order
            console.log('Inserting Order for Customer:', customerId);
            const { data: newOrder, error: orderError } = await supabase
                .from('orders')
                .insert([{
                    customer_id: customerId,
                    stripe_session_id: fullSession.id,
                    subtotal: subtotal,
                    shipping: shippingAmount,
                    total: total,
                    shipping_address: shippingAddress
                }])
                .select('id')
                .single();

            if (orderError) throw orderError;

            // 3. Insert Order Items
            console.log('Inserting Order Items for Order:', newOrder.id);
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

            console.log('Successfully saved test order to Supabase!');

            // Clean up to keep tables tidy
            console.log('Cleaning up test data...');
            await supabase.from('orders').delete().eq('id', newOrder.id);
            await supabase.from('customers').delete().eq('id', customerId);
            console.log('Clean up complete!');

            return { statusCode: 200, body: 'Test Successful! Data inserted and cleaned up.' };

        } catch (dbError) {
            console.error('Failed to save to Supabase:', dbError);
            return { statusCode: 500, body: `Error: ${dbError.message || JSON.stringify(dbError)}` };
        }
    } else {
        return { statusCode: 500, body: 'No Supabase credentials found.' };
    }
};
