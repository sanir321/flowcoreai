
const https = require('https');

async function testGroq() {
  const API_KEY = process.env.GROQ_API_KEY;
  
  if (!API_KEY) {
    console.log("❌ Error: No GROQ_API_KEY found in process.env.");
    return;
  }

  console.log("Testing Groq API Connection...");
  console.log("Model: llama-3.3-70b-versatile");

  const data = JSON.stringify({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: "Hello! Are you working?" }]
  });

  const options = {
    hostname: 'api.groq.com',
    port: 443,
    path: '/openai/v1/chat/completions',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = https.request(options, (res) => {
    let responseBody = '';

    res.on('data', (chunk) => {
      responseBody += chunk;
    });

    res.on('end', () => {
      if (res.statusCode === 200) {
        const parsedData = JSON.parse(responseBody);
        const reply = parsedData.choices?.[0]?.message?.content;
        console.log("✅ Success! Groq replied:");
        console.log(reply);
      } else {
        console.log(`❌ Failed with status ${res.statusCode}`);
        console.log("Error Detail:", responseBody);
      }
    });
  });

  req.on('error', (error) => {
    console.error("Explosion:", error.message);
  });

  req.write(data);
  req.end();
}

testGroq();
