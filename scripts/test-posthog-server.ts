import { captureEvent } from "../src/lib/posthog-server"

async function testPostHog() {
  console.log("Testing PostHog server-side capture...")
  try {
    await captureEvent("test-user-id", "test_event_cli", {
      timestamp: new Date().toISOString(),
      source: "cli-test-script"
    })
    console.log("Successfully sent test event to PostHog.")
  } catch (error) {
    console.error("Failed to send event to PostHog:", error)
  }
}

testPostHog()
