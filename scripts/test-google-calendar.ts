import fs from "fs"
import path from "path"

// Simple env loader for standalone scripts
const envPath = path.resolve(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8")
  envContent.split("\n").forEach(line => {
    const [key, ...valueParts] = line.split("=")
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join("=").trim()
    }
  })
}

import { getCalendarAvailability } from "../src/lib/google"

async function testCalendar() {
  const workspaceId = "7626c093-3ba5-444c-bcc6-5192fa985410"
  const testDate = new Date().toISOString()
  
  console.log(`Testing Google Calendar for Workspace: ${workspaceId} on date: ${testDate}`)
  
  try {
    const busySlots = await getCalendarAvailability(workspaceId, testDate)
    console.log("Successfully fetched calendar availability.")
    console.log("Busy slots found:", JSON.stringify(busySlots, null, 2))
  } catch (error) {
    console.error("Calendar test failed:", error)
  }
}

testCalendar()
