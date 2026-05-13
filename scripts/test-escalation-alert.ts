import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  console.log('Invoking tool-executor...');
  
  // Create a mock session first to ensure we have a valid session ID
  const { data: session, error: sErr } = await supabase.from('conversation_sessions').insert({
    workspace_id: '7626c093-3ba5-444c-bcc6-5192fa985410',
    status: 'active',
    customer_jid: '1234567890@s.whatsapp.net',
    customer_name: 'Test Customer',
    channel: 'whatsapp'
  }).select().single();
  
  if (sErr || !session) {
      console.error("Failed to create session", sErr);
      return;
  }
  
  console.log('Created test session:', session.id);

  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/tool-executor`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({
      tool_name: 'escalation_request',
      args: {
        reason: 'User is angry and wants human (Simulation Test)',
        trigger_type: 'customer_request',
        urgency: 'high'
      },
      workspace_id: '7626c093-3ba5-444c-bcc6-5192fa985410',
      session_id: session.id
    })
  });
  
  const text = await response.text();
  console.log('Status:', response.status);
  console.log('Response:', text);
}
test();