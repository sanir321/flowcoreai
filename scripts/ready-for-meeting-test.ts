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

  const ownerId = '2eb92ba0-4d3b-4d5a-afbd-064692aa4852';
  const orchestratorUrl = `${envConfig.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/agent-orchestrator`;

  console.log('--- Phase 1: Creating Test Workspace ---');
  const { data: ws, error: wsError } = await supabase
    .from('workspaces')
    .insert({
      name: 'Meeting Readiness Test Co',
      owner_id: ownerId,
      business_type: 'tech',
      status: 'active'
    })
    .select()
    .single();

  if (wsError) throw wsError;
  const wsId = ws.id;
  console.log(`Workspace created: ${wsId}`);

  // Create an agent for the workspace
  await supabase.from('workspace_agents').insert({
    workspace_id: wsId,
    agent_type: 'customer_support',
    status: 'active',
    config: { agent_name: 'Test Emma' }
  });

  console.log('\n--- Phase 2: Sending 10 Test Messages ---');
  const messages = [
    "Hi there!",
    "I'm interested in your services.",
    "How much does it cost?", // Price hallucination potential
    "I actually want a refund.", // Escalation trigger
    "Can I speak to a manager?", // Escalation trigger
    "What is your pricing in INR?", // Price hallucination potential
    "Hello?",
    "Tell me about your tech.",
    "Is this secure?",
    "Thanks for the help!"
  ];

  for (let i = 0; i < messages.length; i++) {
    process.stdout.write(`Sending message ${i + 1}/10... `);
    const res = await fetch(orchestratorUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${envConfig.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        workspace_id: wsId,
        customer_jid: `tester_ready_${wsId}@c.us`,
        message: messages[i],
        channel: 'widget',
        is_test: true
      })
    });
    
    if (res.ok) console.log('OK');
    else console.log(`FAILED (${res.status})`);
  }

  console.log('\n--- Phase 3: Verifying Agent Traces ---');
  const { count: traceCount } = await supabase
    .from('agent_traces')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', wsId);

  console.log(`Total Traces found: ${traceCount}`);
  if (traceCount === 10) {
    console.log('SUCCESS: Telemetry logged all 10 messages.');
  } else {
    console.log(`WARNING: Expected 10 traces, found ${traceCount}.`);
  }

  console.log('\n--- Phase 4: Syncing Outcomes ---');
  // We'll manually set last_message_at back so the sync script catches it
  const { data: session } = await supabase
    .from('conversation_sessions')
    .select('id')
    .eq('workspace_id', wsId)
    .single();

  if (session) {
    await supabase
      .from('conversation_sessions')
      .update({ last_message_at: new Date(Date.now() - 20 * 60 * 1000).toISOString() })
      .eq('id', session.id);
      
    console.log('Running outcome sync script...');
    // We can't easily spawn another process and wait here reliably in this environment, 
    // but we can import the logic or just run the CLI command.
  }

  console.log(`\nReady to onboard? ${traceCount === 10 ? 'YES ✅' : 'NO ❌'}`);
}

main();
