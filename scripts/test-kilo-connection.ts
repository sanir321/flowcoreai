
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const KILO_API_KEY = Deno.env.get('KILO_GATEWAY_API_KEY');
const KILO_BASE_URL = 'https://api.kilo.ai/api/gateway';

async function testKilo() {
  console.log("Testing Kilo API Connection...");
  console.log("Model: kilo-auto/free");
  
  try {
    const response = await fetch(`${KILO_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KILO_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "kilo-auto/free",
        messages: [{ role: "user", content: "Hello" }]
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Success! Response:", data.choices[0].message.content);
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log(`❌ Failed with status ${response.status}`);
      console.log("Error Detail:", JSON.stringify(errorData, null, 2));
    }
  } catch (err) {
    console.error("Explosion:", err.message);
  }
}

testKilo();
