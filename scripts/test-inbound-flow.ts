
import crypto from 'crypto';

async function testInboundFlow() {
    console.log("[TEST] Simulating incoming WhatsApp message...");

    const webhookUrl = "http://localhost:3000/api/webhooks/whatsapp";
    const secret = process.env.GOWA_WEBHOOK_SECRET || "SUPER_SECRET_WEBHOOK";

    const payload = {
        event: "message",
        session: "18b8dead-ba3f-430b-8022-6b0eeab14874",
        data: {
            id: `test_${new Date().getTime()}`,
            from: "919876543210@s.whatsapp.net",
            isGroup: false,
            type: "conversation",
            notifyName: "Test User",
            body: `This is a test message from the CLI at ${new Date().toLocaleTimeString()}`,
        },
    };

    const rawBody = JSON.stringify(payload);
    const signature = `sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`;

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-hub-signature-256': signature,
            },
            body: rawBody,
        });

        console.log(`[TEST] Webhook response status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Webhook responded with an error: ${errorText}`);
        }

        const responseData = await response.json();
        console.log("[TEST] Webhook response data:", responseData);
        console.log("
[SUCCESS] Webhook received and processed the message.");
        console.log("To verify, check the database for the new message and the AI's response.");

    } catch (error) {
        console.error("
[FAILED] The inbound flow test failed:", error);
    }
}

testInboundFlow();
