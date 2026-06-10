const WORKSPACE_ID = "53ae24d7-33ea-4af8-a414-5b6635cd2e1c";
const BASE_URL = "https://7flowcore.vercel.app"; // Using production URL to test real routing

async function testWidgetReply() {
  console.log("🧪 Testing Web Widget AI Reply...");
  
  const sessionToken = "test-session-" + Math.random().toString(36).slice(2);
  
  try {
    const res = await fetch(`${BASE_URL}/api/widget/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspace_id: WORKSPACE_ID,
        session_token: "25e47e7c-eca2-4846-afaf-84f176d8ef42", // Using a known valid UUID format
        message: "Hi, I need help with interior design"
      })
    });

    const data = await res.json();
    
    if (res.ok && data.reply) {
      console.log("✅ Success! AI Replied:");
      console.log(`   > AI: "${data.reply}"`);
    } else {
      console.log("❌ Failed!");
      console.log("   > Status:", res.status);
      console.log("   > Response:", data);
    }
  } catch (err) {
    console.error("❌ Error during fetch:", err.message);
  }
}

testWidgetReply();
