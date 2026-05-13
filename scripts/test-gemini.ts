
async function testGemini() {
  const API_KEY = Deno.env.get('GOOGLE_API_KEY') || Deno.env.get('GEMINI_API_KEY');
  
  if (!API_KEY) {
    console.log("❌ Error: No GOOGLE_API_KEY or GEMINI_API_KEY found in environment.");
    return;
  }

  console.log("Testing Gemini API Connection...");
  console.log("Model: gemini-1.5-flash");

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: "Hello! Are you working?" }]
        }]
      })
    });

    if (response.ok) {
      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log("✅ Success! Gemini replied:");
      console.log(reply);
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log(`❌ Failed with status ${response.status}`);
      console.log("Error Detail:", JSON.stringify(errorData, null, 2));
    }
  } catch (err) {
    console.error("Explosion:", err.message);
  }
}

testGemini();
