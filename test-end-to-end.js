const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bnpdrelienfnlkceluip.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const WORKSPACE_ID = 'eb8e551d-cde7-46c3-bafe-817afaeabedd';

async function sendToOrchestrator(payload) {
    const res = await fetch(`${supabaseUrl}/functions/v1/agent-orchestrator`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify(payload)
    });
    
    if (!res.ok) {
        throw new Error(`Orchestrator failed: ${res.status} ${await res.text()}`);
    }
    return await res.json();
}

async function verify() {
    console.log("=== STARTING END-TO-END VERIFICATION ===");
    
    // Test 1: First Message Greeting Verification & Widget Restriction
    console.log("\n[Test 1] Widget Channel - 'I want to buy a website' (Sales Intent)");
    const widgetSessionId = `widget-test-${Date.now()}`;
    const widgetRes = await sendToOrchestrator({
        workspace_id: WORKSPACE_ID,
        customer_jid: widgetSessionId,
        customer_name: "Widget Tester",
        message: "I want to buy a website, what are your packages?",
        channel: "widget",
        is_test: true,
        message_type: "text",
        gowa_message_id: `gowa-${Date.now()}`,
        timestamp: Math.floor(Date.now() / 1000)
    });
    
    console.log(`Agent Used: ${widgetRes.agent_type}`);
    console.log(`Response: ${widgetRes.response}`);
    
    if (widgetRes.agent_type !== "customer_support") {
        console.error("❌ FAILED: Widget did not force Customer Support agent!");
    } else {
        console.log("✅ PASSED: Widget correctly forced Customer Support despite sales intent.");
    }
    
    if (!widgetRes.response.toLowerCase().includes("welcome")) {
         console.warn("⚠️ WARNING: First message greeting might not be in the response.");
    } else {
         console.log("✅ PASSED: First message greeting correctly prepended.");
    }

    // Test 2: WhatsApp Channel - Normal Routing to Booking
    console.log("\n[Test 2] WhatsApp Channel - Normal Routing to Booking");
    const waSessionId = `1234567890${Date.now().toString().slice(-4)}`;
    const waRes = await sendToOrchestrator({
        workspace_id: WORKSPACE_ID,
        customer_jid: waSessionId,
        customer_phone: waSessionId,
        message: "I want to book an appointment for tomorrow",
        source: "whatsapp",
        is_test: true,
        message_type: "text",
        gowa_message_id: `gowa-${Date.now()+1}`,
        timestamp: Math.floor(Date.now() / 1000)
    });
    
    console.log(`Agent Used: ${waRes.agent_type}`);
    console.log(`Response: ${waRes.response}`);
    
    if (waRes.agent_type !== "appointment_booking") {
        console.error("❌ FAILED: WhatsApp did not route to appointment_booking!");
    } else {
        console.log("✅ PASSED: WhatsApp routed to appointment_booking correctly.");
    }

    // Test 3: Disable Booking Agent and test again
    console.log("\n[Test 3] WhatsApp Channel - Disabled Booking Agent");
    console.log("Disabling appointment_booking agent in database...");
    
    await supabase.from('workspace_agents')
        .update({ status: 'inactive' })
        .eq('workspace_id', WORKSPACE_ID)
        .eq('agent_type', 'appointment_booking');
        
    const waSessionId2 = `0987654321${Date.now().toString().slice(-4)}`;
    const waRes2 = await sendToOrchestrator({
        workspace_id: WORKSPACE_ID,
        customer_jid: waSessionId2,
        customer_phone: waSessionId2,
        message: "I want to schedule an appointment please",
        source: "whatsapp",
        is_test: true,
        message_type: "text",
        gowa_message_id: `gowa-${Date.now()+2}`,
        timestamp: Math.floor(Date.now() / 1000)
    });
    
    console.log(`Agent Used: ${waRes2.agent_type}`);
    console.log(`Response: ${waRes2.response}`);
    
    if (waRes2.agent_type === "appointment_booking") {
        console.error("❌ FAILED: Routed to disabled agent!");
    } else {
        console.log(`✅ PASSED: Correctly bypassed disabled agent and fell back to ${waRes2.agent_type}.`);
    }

    // Restore the agent
    console.log("\nRestoring appointment_booking agent...");
    await supabase.from('workspace_agents')
        .update({ status: 'active' })
        .eq('workspace_id', WORKSPACE_ID)
        .eq('agent_type', 'appointment_booking');
        
    console.log("=== VERIFICATION COMPLETE ===");
}

verify().catch(console.error);
