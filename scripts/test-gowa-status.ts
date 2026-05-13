// scripts/test-gowa-status.ts
import { checkGoWASessionHealth } from "../src/lib/gowa";

async function testGoWA() {
    const workspaceId = "7626c093-3ba5-444c-bcc6-5192fa985410"; // Using a known workspace
    console.log(`[TEST] Checking GoWA status for workspace: ${workspaceId}`);
    try {
        const result = await checkGoWASessionHealth(workspaceId);
        console.log(`[SUCCESS] GoWA Status Check Completed.`);
        console.log("Result:", result);
    } catch (error) {
        console.error("[FAILED] GoWA Status Check failed:", error);
    }
}
testGoWA();
