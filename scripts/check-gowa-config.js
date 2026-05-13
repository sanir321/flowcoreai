const GOWA_BASE_URL = "https://go-whatsapp-web-multidevice-production-ba8e.up.railway.app";
const GOWA_API_KEY = "flowcore:FlowCore@2026";
const GOWA_AUTH = Buffer.from(GOWA_API_KEY).toString('base64');

async function checkGoWA() {
  try {
    console.log("Fetching devices...");
    const response = await fetch(`${GOWA_BASE_URL}/devices`, {
      headers: { 
        'Authorization': `Basic ${GOWA_AUTH}`
      }
    });
    
    if (!response.ok) {
      console.error("Failed to fetch devices:", response.status, await response.text());
      return;
    }
    
    const data = await response.json();
    console.log("Devices:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}

checkGoWA();
