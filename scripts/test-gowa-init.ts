// scripts/test-gowa-init.ts
import { initiateQRLogin } from "../../src/lib/gowa";

async function testGoWAInit() {
    const workspaceId = "7626c093-3ba5-444c-bcc6-5192fa985410"; // Using a known workspace
    console.log(`[TEST] Initializing GoWA QR Login for workspace: ${workspaceId}`);
    try {
        const result = await initiateQRLogin(workspaceId);
        console.log(`[SUCCESS] GoWA QR Login Initialized.`);
        if (result.qr_code) {
            console.log("QR Code received (first 50 chars):", result.qr_code.substring(0, 50));
        } else {
            console.warn("[WARN] No QR code in response, but call succeeded.", result);
        }
    } catch (error) {
        console.error("[FAILED] GoWA QR Login failed:", error);
    }
}
testGoWAInit();
