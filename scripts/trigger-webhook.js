const GOWA_BASE_URL = "https://go-whatsapp-web-multidevice-production-ba8e.up.railway.app";
const GOWA_API_KEY = "flowcore:FlowCore@2026";
const GOWA_AUTH = Buffer.from(GOWA_API_KEY).toString('base64');
const DEVICE_ID = "2c2c1e44-c725-470a-b8e4-d2afb59a10ae";

async function sendMessage() {
  try {
    console.log(`Sending message from device ${DEVICE_ID} to itself...`);
    const response = await fetch(`${GOWA_BASE_URL}/send/message`, {
      method: 'POST',
      headers: { 
        'Authorization': `Basic ${GOWA_AUTH}`,
        'X-Device-Id': DEVICE_ID,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: "918072432187",
        message: "Test from Agent to itself"
      })
    });
    
    const data = await response.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}

sendMessage();
