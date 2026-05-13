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
  const customerJid = 'booking_tester_999@c.us';
  const orchestratorUrl = `${envConfig.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/agent-orchestrator`;

  console.log('--- AI Tool Chain Test: Booking ---');

  // Turn 1: Explicit booking request
  console.log('\nTurn 1: Requesting teeth whitening tomorrow at 4 PM...');
  const res1 = await fetch(orchestratorUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${envConfig.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      workspace_id: workspaceId,
      customer_jid: customerJid,
      message: "I want to book an appointment for teeth whitening tomorrow at 4 PM. My name is Samir and my phone is +1 555 123 4567.",
      channel: 'widget',
      is_test: true
    })
  });

  const data1 = await res1.json();
  console.log('AI Response:', data1.response_parts?.[0]);
  console.log('Metadata:', JSON.stringify(data1.metadata));

  // Turn 2: Confirmation
  console.log('\nTurn 2: Confirming the booking...');
  const res2 = await fetch(orchestratorUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${envConfig.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      workspace_id: workspaceId,
      customer_jid: customerJid,
      message: "Yes, please book it now.",
      channel: 'widget',
      is_test: true
    })
  });

  const data2 = await res2.json();
  console.log('AI Response:', data2.response_parts?.[0]);

  // DB Verification
  console.log('\n--- Final Verification in Database ---');
  const { data: appts } = await supabase
    .from('appointments')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('customer_name', 'Samir')
    .order('created_at', { ascending: false })
    .limit(1);

  if (appts && appts.length > 0) {
    const appt = appts[0];
    console.log('✅ Appointment Created:', appt.id);
    console.log('✅ Service:', appt.service);
    console.log('✅ Google Sync ID:', appt.google_event_id ? 'EXISTS (Synced! 🚀)' : 'MISSING');
  } else {
    console.log('❌ FAILED: No appointment found in database.');
  }

  console.log('\n--- Test Complete ---');
}

main();
