import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

async function main() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  
  const supabase = createClient(
    envConfig.NEXT_PUBLIC_SUPABASE_URL,
    envConfig.SUPABASE_SERVICE_ROLE_KEY
  );

  const workspaceId = '7626c093-3ba5-444c-bcc6-5192fa985410';
  const customerJid = 'test_customer_123@c.us';
  const orchestratorUrl = `${envConfig.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/agent-orchestrator`;

  console.log('--- AI Booking Test Started ---');

  // Turn 1: Intent to book
  console.log('\nTurn 1: Customer expresses intent to book...');
  const res1 = await fetch(orchestratorUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${envConfig.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      workspace_id: workspaceId,
      customer_jid: customerJid,
      message: "Hi, I want to book an appointment for tomorrow at 3 PM. My name is Test User and my phone is +1 555 999 8888.",
      channel: 'widget',
      agent_type: 'appointment_booking',
      is_test: true
    })
  });

  const data1 = await res1.json();
  console.log('AI Response:', data1.response_parts?.[0]);

  if (data1.metadata?.action === 'ask_for_confirmation') {
      console.log('\nTurn 2: Customer confirms the slot...');
      const res2 = await fetch(orchestratorUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${envConfig.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workspace_id: workspaceId,
          customer_jid: customerJid,
          message: "Yes, that works for me. Please confirm.",
          channel: 'widget',
          agent_type: 'appointment_booking',
          is_test: true
        })
      });

      const data2 = await res2.json();
      console.log('AI Response:', data2.response_parts?.[0]);
      
      // Verify in DB
      console.log('\nVerifying appointment in database...');
      const { data: appts, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('customer_name', 'Test User')
        .order('created_at', { ascending: false })
        .limit(1);

      if (appts && appts.length > 0) {
        console.log('SUCCESS: Appointment found in DB!');
        console.log('ID:', appts[0].id);
        console.log('Status:', appts[0].status);
        console.log('Google Event ID:', appts[0].google_event_id ? 'EXISTS (Synced ✅)' : 'MISSING (Check Google Sync)');
      } else {
        console.log('FAILED: Appointment not found in DB.');
      }
  } else {
      console.log('\nAI did not ask for confirmation. It might have checked availability and found a conflict.');
      console.log('Tool Result:', JSON.stringify(data1.tool_result));
  }

  console.log('\n--- AI Booking Test Complete ---');
}

main();
