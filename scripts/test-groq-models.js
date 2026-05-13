
const https = require('https');

const API_KEY = process.env.GROQ_API_KEY;

async function callGroq(model) {
  const data = JSON.stringify({
    model: model,
    messages: [{ role: "user", content: "Explain in one sentence why you are the best model for a real-time WhatsApp AI agent." }]
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

  const start = Date.now();
  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let b = '';
      res.on('data', (c) => b += c);
      res.on('end', () => {
        const end = Date.now();
        if (res.statusCode === 200) {
          const parsed = JSON.parse(b);
          resolve({
            model,
            latency: end - start,
            reply: parsed.choices[0].message.content,
            tokens: parsed.usage.total_tokens
          });
        } else {
          resolve({ model, error: res.statusCode, detail: b });
        }
      });
    });
    req.on('error', (e) => resolve({ model, error: 'Request Failed', detail: e.message }));
    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log("🚀 Starting Groq Performance Tests...\n");
  const models = [
    'meta-llama/llama-4-scout-17b-16e-instruct',
    'openai/gpt-oss-120b',
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant'
  ];

  for (const model of models) {
    process.stdout.write(`Testing ${model}... `);
    const result = await callGroq(model);
    if (result.error) {
      console.log(`❌ Failed (${result.error})`);
      console.log(`   Detail: ${result.detail}\n`);
    } else {
      console.log(`✅ ${result.latency}ms`);
      console.log(`   Reply: "${result.reply}"\n`);
    }
  }
}

runTests();
