
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const SUPABASE_URL = "https://bnpdrelienfnlkceluip.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJucGRyZWxpZW5mbmxrY2VsdWlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njg1ODI0MiwiZXhwIjoyMDkyNDM0MjQyfQ.OURQfh3fe0ZFpHzKfis3ym6-v0Ug2qbwBdIEalJr6CU";
const WORKSPACE_ID = "7626c093-3ba5-444c-bcc6-5192fa985410";

const scenarios = [
  { id: 34, message: "Are there any hidden fees I should be aware of?" },
  { id: 35, message: "I'd like to see some testimonials from other clients in my industry." },
  { id: 36, message: "Is my personal data safe with your company?" },
  { id: 37, message: "I accidentally booked for the wrong day, can you fix it?" },
  { id: 38, message: "Do you offer weekend appointments for working professionals?" },
  { id: 39, message: "I am very unhappy with the quality of the service I received." },
  { id: 40, message: "How do I integrate your API with my existing CRM?" },
  { id: 41, message: "Can I get a discount if I refer a friend to you?" },
  { id: 42, message: "I need to book something urgently for this afternoon." },
  { id: 43, message: "What happens if I'm late to my scheduled appointment?" },
  { id: 44, message: "I'm reporting this business to the Better Business Bureau." },
  { id: 45, message: "Tell me about your sustainability and ethical sourcing practices." },
  { id: 46, message: "I'd like to buy this as a gift for someone else, is that possible? " },
  { id: 47, message: "Why is the price on the website different from what you're telling me?" },
  { id: 48, message: "I need a manager to call me back on this number ASAP." },
  { id: 49, message: "What's the best way to get in touch for technical support?" },
  { id: 50, message: "Can I pay using cryptocurrency or only credit cards?" },
  { id: 51, message: "I'm looking for a specific product but I don't see it listed." },
  { id: 52, message: "Can I book a recurring appointment every Monday at 9 AM?" },
  { id: 53, message: "This is a legal matter and I require an official statement." },
  { id: 54, message: "How do I delete my account and all associated data?" },
  { id: 55, message: "What are the benefits of choosing your company over your competitors?" },
  { id: 56, message: "I need help setting up the software for the first time." },
  { id: 57, message: "I'm so angry I could scream, your service is terrible!" },
  { id: 58, message: "Do you have a physical catalog you can mail to me?" },
  { id: 59, message: "Can I book a consultation if I'm located outside the country?" },
  { id: 60, message: "I want to upgrade my plan but I don't see the option." },
  { id: 61, message: "Is there a limit to how many appointments I can book in a month?" },
  { id: 62, message: "Your website is down and I can't access my files." },
  { id: 63, message: "I'm going to sue if you don't refund my deposit immediately." },
  { id: 64, message: "What is the typical ROI for businesses using your platform?" },
  { id: 65, message: "Can I speak to someone about a custom enterprise solution?" },
  { id: 66, message: "I'm having trouble with the 'forgot password' link." },
  { id: 67, message: "Do you offer any scholarships or discounts for non-profits?" },
  { id: 68, message: "Can I book an appointment for my daughter under my name?" },
  { id: 69, message: "What is your policy on cancellations made less than 24 hours in advance?" },
  { id: 70, message: "I've already told you three times, stop repeating yourself!" },
  { id: 71, message: "How do I export my data to a CSV file?" },
  { id: 72, message: "Do you have a referral program for existing users?" },
  { id: 73, message: "Can I book a tour of your facility before I sign up?" },
  { id: 74, message: "What languages does Emma support besides English?" },
  { id: 75, message: "I'm experiencing a bug where the screen goes blank." },
  { id: 76, message: "I want to speak to the owner of this business." },
  { id: 77, message: "Do you offer a free trial period for new users?" },
  { id: 78, message: "Can I book an appointment via the web widget as well?" },
  { id: 79, message: "How do I change my notification settings for WhatsApp?" },
  { id: 80, message: "I am extremely disappointed in the lack of professional communication." },
  { id: 81, message: "What's the difference between the monthly and annual billing cycles?" },
  { id: 82, message: "Can I add more than one person to my booking?" },
  { id: 83, message: "I need a direct line to your billing department." },
  { id: 84, message: "How often do you release new updates and features?" },
  { id: 85, message: "I'd like to submit a feature request for the next version." },
  { id: 86, message: "Can I book a discovery call for 15 minutes?" },
  { id: 87, message: "What should I bring with me to my first appointment?" },
  { id: 88, message: "I'm leaving for a competitor if you don't fix this bug." },
  { id: 89, message: "Do you provide any training sessions for new staff members?" },
  { id: 90, message: "Can I pay for my subscription using a bank transfer?" },
  { id: 91, message: "I'm not sure if this is the right service for me, can you help?" },
  { id: 92, message: "Can I book an appointment for a specific staff member?" },
  { id: 93, message: "Your AI is not understanding my request at all." },
  { id: 94, message: "How do I set up my business profile on the dashboard?" },
  { id: 95, message: "I'd like to see a case study of a business similar to mine." },
  { id: 96, message: "Can I change my email address associated with the account?" },
  { id: 97, message: "I'm getting too many messages from this bot, how do I stop it?" },
  { id: 98, message: "What are your terms and conditions for service?" },
  { id: 99, message: "I need to book a follow-up appointment for next month." },
  { id: 100, message: "Do you have a developer portal for API documentation?" }
];

async function runSimulation() {
  const orchestratorUrl = `${SUPABASE_URL}/functions/v1/agent-orchestrator`;
  const results = [];

  for (const scenario of scenarios) {
    console.log(`Running Scenario ${scenario.id}: ${scenario.message}`);
    const customerJid = `sim_${scenario.id}@c.us`;
    
    try {
      const res = await fetch(orchestratorUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workspace_id: WORKSPACE_ID,
          customer_jid: customerJid,
          message: scenario.message,
          channel: 'whatsapp',
          agent_type: 'customer_support',
          is_test: true
        })
      });

      const data = await res.json();
      results.push({
        id: scenario.id,
        request: scenario.message,
        response: data.response_parts?.[0] || "NO_RESPONSE",
        metadata: data.metadata || {}
      });
      
      console.log(`Response: ${data.response_parts?.[0]?.substring(0, 50)}...`);
    } catch (err) {
      console.error(`Error in Scenario ${scenario.id}:`, err.message);
      results.push({ id: scenario.id, request: scenario.message, error: err.message });
    }
  }

  // Final Summary
  console.log("\n--- SIMULATION COMPLETE ---");
  // We'll write the results to a file for easier analysis
  // But since I'm running in Deno/Node, I'll just print it or save it if I can.
}

runSimulation();
