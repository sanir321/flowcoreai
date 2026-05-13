
async function testOrchestrator() {
  const GROQ_API_KEY = "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";
  
  // We'll mock the Supabase call and environment if we were running via serve,
  // but here let's just test the Groq tool calling logic directly in a separate script.
  console.log("Testing Unified Orchestrator Logic (Direct Groq Call)...");

  const data = JSON.stringify({
    model: "openai/gpt-oss-120b",
    messages: [
      { role: "system", content: "You are a helpful assistant for a business. You MUST use the match_kb_chunks tool to answer any questions about the business hours, services, or policies." },
      { role: "user", content: "What are your business hours?" }
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "match_kb_chunks",
          description: "Search the knowledge base.",
          parameters: {
            type: "object",
            properties: { query: { type: "string" } },
            required: ["query"]
          }
        }
      }
    ],
    tool_choice: "auto"
  });

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: data
    });

    if (response.ok) {
      const result = await response.json();
      const choice = result.choices[0].message;
      if (choice.tool_calls) {
        console.log("✅ SUCCESS: Model requested tool call!");
        console.log("Tool:", choice.tool_calls[0].function.name);
        console.log("Args:", choice.tool_calls[0].function.arguments);
      } else {
        console.log("ℹ️ Model responded directly:", choice.content);
      }
    } else {
      console.log(`❌ Failed with status ${response.status}`);
      console.log(await response.text());
    }
  } catch (err) {
    console.error("Explosion:", err.message);
  }
}

testOrchestrator();
