require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testConnection() {
    console.log('Testing Supabase Connection...');
    console.log('URL:', process.env.SUPABASE_URL);
    console.log('Key starts with:', process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10) + '...' : 'MISSING!');

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('Missing credentials!');
        return;
    }

    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        const { data, error } = await supabase
            .from('customers')
            .insert([{
                email: 'test@example.com',
                name: 'Test Setup User',
                phone: '555-0123'
            }])
            .select();

        if (error) {
            console.error('Insert failed:', error.message);
        } else {
            console.log('Insert successful! Data:', JSON.stringify(data, null, 2));

            // Cleanup
            console.log('\nCleaning up test data...');
            const { error: deleteError } = await supabase
                .from('customers')
                .delete()
                .eq('id', data[0].id);

            if (deleteError) {
                console.error('Cleanup failed:', deleteError.message);
            } else {
                console.log('Cleanup complete.');
            }
        }
    } catch (err) {
        console.error('Script error:', err.message);
    }
}

testConnection();
