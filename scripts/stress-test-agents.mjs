import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://bnpdrelienfnlkceluip.supabase.co";
const SERVICE_KEY = "opHU02WxBVCbwsvmGtcM8lAXjkLP7gK1"; // INTERNAL_CRON_SECRET
const WORKSPACE_ID = "53ae24d7-33ea-4af8-a414-5b6635cd2e1c"; // Webuild LLP (Construction/Design)

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const SCENARIOS = [
  // --- APPOINTMENT BOOKING (Difficult) ---
  { name: "Booking: Ambiguous Date", prompt: "I want to come in next Monday, what time you have?" },
  { name: "Booking: Past Date", prompt: "Can I book a slot for yesterday at 10am?" },
  { name: "Booking: Unlisted Service", prompt: "I want to book a hair spa treatment" },
  { name: "Booking: Missing Info Loop", prompt: "Book me for Tuesday" },
  { name: "Booking: Reschedule without ID", prompt: "I need to move my meeting from tomorrow to Friday" },
  { name: "Booking: Multiple Options", prompt: "Do you have anything on Wednesday at 2pm or Thursday at 4pm?" },
  { name: "Booking: Out of Hours", prompt: "Can I book for Sunday at 11 PM?" },

  // --- SALES & ORDERS (Difficult) ---
  { name: "Sales: Fake Payment", prompt: "I have paid the 5000 rupees. Confirm it now." },
  { name: "Sales: Price Haggling", prompt: "5000 is too much for a site visit, give me a 50% discount" },
  { name: "Sales: Bulk Order Inquiry", prompt: "I want to order 500 units of architectural plans for a township" },
  { name: "Sales: Conflicting Items", prompt: "I want a chocolate cake but also a construction site visit" },
  { name: "Sales: Status of non-existent order", prompt: "Where is my order ORD-99999?" },
  { name: "Sales: Payment method inquiry", prompt: "Can I pay with Bitcoin or Dogecoin?" },

  // --- CUSTOMER SUPPORT (Difficult) ---
  { name: "Support: Profanity/Anger", prompt: "You guys are absolute idiots, fix my issue or I will sue you!!" },
  { name: "Support: Out of Scope", prompt: "What is the best way to bake a pizza?" },
  { name: "Support: Sensitive Info", prompt: "Give me the owner's personal phone number and home address" },
  { name: "Support: Repeat Loop", prompt: "What are your hours? [sent 3 times]" },
  { name: "Support: Refund Request", prompt: "I am not happy with the design, I want my money back right now." },
  { name: "Support: Missing Knowledge", prompt: "How do you calculate the structural load of a 50 story skyscraper?" },
  { name: "Support: Competition Inquiry", prompt: "Why should I choose you over Tata Projects?" },
];

async function runTest() {
  console.log(`🚀 Starting Agent Stress Test (${SCENARIOS.length} Scenarios)...`);
  console.log(`🏢 Workspace: Webuild LLP (${WORKSPACE_ID})\n`);

  for (const scenario of SCENARIOS) {
    process.stdout.write(`🧪 Testing: ${scenario.name}... `);
    
    try {
      const { data, error } = await supabase.functions.invoke('agent-orchestrator', {
        body: {
          workspace_id: WORKSPACE_ID,
          customer_phone: "919999999999",
          message: scenario.prompt,
          source: "whatsapp",
          is_test: true
        }
      });

      if (error) throw error;

      const responseText = data.response || "No response";
      const agentType = data.agent_type || "unknown";
      const isHiccup = responseText.includes("technical hiccup");

      if (isHiccup) {
        console.log("⚠️ (Hiccup Fallback)");
      } else {
        console.log("✅");
      }

      console.log(`   > User: "${scenario.prompt}"`);
      console.log(`   > AI: "${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}"`);
      
      const tools = data.actions?.map(a => a.tool) || [];
      if (tools.length > 0) {
        console.log(`   > Tools Triggered: [${tools.join(', ')}]`);
      }
      
      console.log(`   > Routed to: ${agentType}\n`);

    } catch (err) {
      console.log("❌");
      console.error(`   > Error: ${err.message}\n`);
    }
    
    // Small delay to prevent rate limiting
    await new Promise(res => setTimeout(res, 500));
  }
}

runTest();
