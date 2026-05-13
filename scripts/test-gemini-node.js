
const https = require('https');

async function testGemini() {
  const API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!API_KEY) {
    console.log("❌ Error: No GOOGLE_API_KEY or GEMINI_API_KEY found in process.env.");
    return;
  }

  console.log("Testing Gemini API Connection via Node...");
  console.log("Model: gemini-1.5-flash");

  const data = JSON.stringify({
    contents: [{
      parts: [{ text: "Hello! Are you working?" }]
    }]
  });

  const options = {
    hostname: 'generativelanguage.googleapis.com',
    port: 443,
    path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
    method: 'POST',
    headers: {
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
        const reply = parsedData.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log("✅ Success! Gemini replied:");
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

testGemini();
