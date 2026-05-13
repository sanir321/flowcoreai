const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function monitor() {
    console.log('--- 📡 FlowCore Live Monitor Started ---');
    console.log(`Monitoring for new messages in workspace: 7626c093-3ba5-444c-bcc6-5192fa985410`);
    console.log('Please send a WhatsApp message to the business number now...\n');

    let lastChecked = new Date().toISOString();

    const interval = setInterval(async () => {
        try {
            // 1. Check for new inbound messages
            const { data: messages, error } = await supabase
                .from('messages')
                .select('content, created_at, role')
                .eq('workspace_id', '7626c093-3ba5-444c-bcc6-5192fa985410')
                .eq('direction', 'inbound')
                .gt('created_at', lastChecked)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('[ERROR] Failed to query messages:', error.message);
                return;
            }

            if (messages && messages.length > 0) {
                console.log('\n✅ SUCCESS: NEW MESSAGE RECEIVED!');
                messages.forEach(m => {
                    console.log(`[${m.created_at}] ${m.role}: ${m.content}`);
                });
                console.log('\n--- Webhook is 100% Functional! ---');
                clearInterval(interval);
                process.exit(0);
            } else {
                process.stdout.write('.'); // Heartbeat
            }

            lastChecked = new Date().toISOString();
        } catch (err) {
            console.error('[ERROR] Monitor loop failed:', err.message);
        }
    }, 3000);
}

monitor();
