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

import { appendSheetRow } from "../src/lib/google"

async function testSheets() {
  const workspaceId = "7626c093-3ba5-444c-bcc6-5192fa985410"
  
  console.log(`Testing Google Sheets for Workspace: ${workspaceId}`)
  
  try {
    const row = [
      new Date().toLocaleString(),
      "Test User",
      "918072432187",
      "CLI Test",
      "Successful sync"
    ]
    await appendSheetRow(workspaceId, row)
    console.log("Successfully appended row to Google Sheet.")
  } catch (error) {
    console.error("Sheets test failed:", error)
  }
}

testSheets()
