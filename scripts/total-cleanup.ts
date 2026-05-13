import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

const GOWA_BASE_URL = process.env.GOWA_BASE_URL?.replace(/\/$/, "") || "";
const GOWA_API_KEY = process.env.GOWA_API_KEY || "";
const GOWA_AUTH = Buffer.from(GOWA_API_KEY).toString('base64');

async function cleanup() {
  console.log("Starting Total GoWA Cleanup...")
  
  const response = await fetch(`${GOWA_BASE_URL}/devices`, {
    headers: { 'Authorization': `Basic ${GOWA_AUTH}` }
  });
  
  const data = await response.json();
  const devices = data.results || [];
  
  console.log(`Found ${devices.length} devices.`);
  
  for (const device of devices) {
    console.log(`Deleting device: ${device.id} (${device.state})...`);
    await fetch(`${GOWA_BASE_URL}/devices/${device.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Basic ${GOWA_AUTH}` }
    });
  }
  
  console.log("Cleanup complete.");
}

cleanup();
