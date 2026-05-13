const GOWA_BASE_URL = "https://go-whatsapp-web-multidevice-production-ba8e.up.railway.app";
const GOWA_API_KEY = "flowcore:FlowCore@2026";
const GOWA_AUTH = Buffer.from(GOWA_API_KEY).toString('base64');
const DEVICE_ID = "2c2c1e44-c725-470a-b8e4-d2afb59a10ae"; // From check-gowa-config.js

async function checkMessages() {
  try {
    console.log(`Fetching chats for device ${DEVICE_ID}...`);
    const response = await fetch(`${GOWA_BASE_URL}/chats`, {
      headers: { 
        'Authorization': `Basic ${GOWA_AUTH}`,
        'X-Device-Id': DEVICE_ID
      }
    });
    
    if (!response.ok) {
      console.error("Failed to fetch chats:", response.status, await response.text());
      return;
    }
    
    const data = await response.json();
    console.log("Recent Chats:", JSON.stringify(data.results?.data?.slice(0, 5), null, 2));

    if (data.results?.data?.length > 0) {
        const firstChat = data.results.data[0];
        console.log(`\nFetching messages for chat: ${firstChat.jid}`);
        const msgResponse = await fetch(`${GOWA_BASE_URL}/chat/${firstChat.jid}/messages?limit=5`, {
            headers: { 
              'Authorization': `Basic ${GOWA_AUTH}`,
              'X-Device-Id': DEVICE_ID
            }
        });
        const msgData = await msgResponse.json();
        console.log("Recent Messages:", JSON.stringify(msgData.results?.data, null, 2));
    }

  } catch (error) {
    console.error("Error:", error);
  }
}

checkMessages();
