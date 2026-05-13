const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const payload = {
    workspace_id: '7626c093-3ba5-444c-bcc6-5192fa985410',
    customer_jid: '917904721312@s.whatsapp.net',
    message: 'Hii',
    channel: 'whatsapp',
    agent_type: 'customer_support'
};

async function reTrigger() {
    console.log('--- 🚀 Re-triggering AI for last message ---');
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/agent-orchestrator`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('AI Response:', JSON.stringify(data, null, 2));
        
        if (response.ok) {
            console.log('\n✅ AI successfully processed the message!');
        } else {
            console.error('\n❌ AI failed to process.');
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
}

reTrigger();
