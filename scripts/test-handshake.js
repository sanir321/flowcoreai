const crypto = require('crypto');

const secret = 'flowcoresecret2026';
const anonKey = 'sb_publishable_6wavmaqyv2hYK8a1W6AqxQ_A54WE0_M';
const webhookUrl = 'https://bnpdrelienfnlkceluip.supabase.co/functions/v1/gowa-webhook?apikey=' + anonKey;

const payload = JSON.stringify({
  event: 'message',
  timestamp: Math.floor(Date.now() / 1000),
  session: '2c2c1e44-c725-470a-b8e4-d2afb59a10ae',
  data: {
    id: 'manual_test_' + Date.now(),
    from: '917904721312@s.whatsapp.net',
    pushName: 'Samir',
    isGroup: false,
    type: 'conversation',
    body: 'Handshake verification with API key',
    timestamp: Math.floor(Date.now() / 1000)
  }
});

const signature = 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');

async function testWebhook() {
  console.log('Sending manual webhook test with API Key...');
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
