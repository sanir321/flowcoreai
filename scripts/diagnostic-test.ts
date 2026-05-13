/**
 * diagnostic-test.ts
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import * as gowa from "../src/lib/gowa";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runDiagnostics() {
  console.log("🚀 Starting FlowCore Diagnostic Test...\n");

  const TEST_WS_ID = "4d188475-4979-464f-abaa-91882bb91810";
  const TEST_AGENT_TYPE = "appointment_booking";

  // 1. Supabase Check
  console.log("📡 Checking Supabase Connectivity...");
  const { data: ws, error: wsError } = await supabase.from("workspaces").select("name").eq("id", TEST_WS_ID).single();
  if (wsError) {
    console.error("❌ Supabase Error:", wsError.message);
  } else {
    console.log(`✅ Supabase Connected. Workspace: ${ws.name}`);
  }

  // 2. GoWA Check
  console.log("\n💬 Checking GoWA WhatsApp Bridge...");
  console.log(`   URL: ${process.env.GOWA_BASE_URL || 'undefined'}`);
  
  if (!process.env.GOWA_API_KEY) {
    console.log("ℹ️ Skipping GoWA check: GOWA_API_KEY not found in .env.local");
  } else {
    try {
      const devices = await gowa.getDevices();
      console.log(`✅ GoWA Connected. Online Devices: ${devices.length}`);
    } catch (e: any) {
      console.error("❌ GoWA Error:", e.message);
    }
  }

  // 3. AI Orchestrator Test
  console.log("\n🧠 Testing AI Orchestrator Pipeline...");
  const testPayload = {
    workspace_id: TEST_WS_ID,
    message: "Hi, I'd like to book an appointment for tomorrow at 10am.",
    customer_jid: "diagnostic-test-jid",
    channel: "widget",
    agent_type: TEST_AGENT_TYPE,
    is_test: true
  };

  try {
    const { data: aiRes, error: aiError } = await supabase.functions.invoke("agent-orchestrator", {
      body: testPayload
    });

    if (aiError) {
      console.error("❌ AI Orchestrator Error:", aiError.message);
    } else {
      console.log("✅ AI Orchestrator Responded:");
      console.log(`   Intent: ${aiRes.metadata?.intent}`);
      console.log(`   Reply: ${aiRes.response_parts[0]}`);
    }
  } catch (e: any) {
    console.error("❌ Edge Function Invocation Failed:", e.message);
  }

  // 4. Google Tokens Check
  console.log("\n📅 Checking Google Integrations...");
  const { data: tokens } = await supabase.from("google_oauth_tokens").select("*").eq("workspace_id", TEST_WS_ID).maybeSingle();
  if (!tokens) {
    console.log("ℹ️ No Google integration connected for this workspace.");
  } else {
    console.log(`✅ Found Google token for workspace.`);
    const isExpired = new Date(tokens.token_expiry) < new Date();
    console.log(`   Status: ${isExpired ? 'EXPIRED' : 'ACTIVE'} (Expires: ${tokens.token_expiry})`);
  }

  console.log("\n🏁 Diagnostic Complete.");
}

runDiagnostics();
