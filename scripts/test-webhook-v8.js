const crypto = require('crypto');

const secret = 'flowcoresecret2026';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJucGRyZWxpZW5mbmxrY2VsdWlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njg1ODI0MiwiZXhwIjoyMDkyNDM0MjQyfQ.OURQfh3fe0ZFpHzKfis3ym6-v0Ug2qbwBdIEalJr6CU';
const webhookUrl = 'https://bnpdrelienfnlkceluip.supabase.co/functions/v1/gowa-webhook?apikey=' + serviceRoleKey;

const payload = JSON.stringify({
  event: 'message',
  device_id: '918072432187@s.whatsapp.net',
  payload: {
    id: 'v8_test_sr_' + Date.now(),
    chat_id: '917904721312@s.whatsapp.net',
    from: '917904721312@s.whatsapp.net',
    from_name: 'Samir (SR)',
    timestamp: new Date().toISOString(),
    is_from_me: false,
    body: 'Verifying Service Role Key workaround'
  }
});

const signature = 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');

async function testWebhook() {
  console.log('Sending SR webhook test...');
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hub-signature-256': signature
      },
      body: payload
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Test Failed:', error.message);
  }
}

testWebhook();
