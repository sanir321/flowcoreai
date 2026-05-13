# API Reference: FlowCore & GoWA Integration

This document details the REST API endpoints used to communicate between the Dashboard and the WhatsApp Bridge.

## 1. GoWA REST API (Outbound)
These endpoints are hosted on your Railway server.

### POST `/send/message`
Sends a text message to a WhatsApp number.

**Headers:**
- `Authorization`: Basic `base64(user:pass)`
- `X-Device-Id`: Your GoWA Session UUID

**Body:**
```json
{
  "to": "918807872154@s.whatsapp.net",
  "body": "Hello from the dashboard!"
}
```

### GET `/chat/{jid}/messages`
Retrieves chat history for a specific number.

**Query Parameters:**
- `limit`: (Optional) Number of messages to fetch (default: 50)

---

## 2. Supabase Edge Functions (Inbound)
These endpoints are hosted on Supabase and handle incoming signals.

### POST `/functions/v1/gowa-webhook`
The central entry point for all WhatsApp events.

**URL Parameters:**
- `apikey`: Your Supabase Publishable Key

**Headers:**
- `X-Hub-Signature-256`: HMAC SHA256 signature for security.

**Events Handled:**
- `message`: New inbound or outbound messages.
- `message.ack`: Delivery and read receipts.

---

## 3. Next.js Internal APIs
These are used by the frontend to communicate with the backend.

### GET `/api/gowa/status`
Checks if the WhatsApp account is currently connected to GoWA.

**Response:**
```json
{
  "status": "connected",
  "jid": "917904721312@s.whatsapp.net"
}
```

### POST `/api/gowa/pair`
Generates a QR code or pairing code for a new WhatsApp connection.

---

## 4. Security Implementation (HMAC)
To ensure only your GoWA server can call your webhook, we use HMAC verification.

**The Logic:**
1.  GoWA takes the raw JSON body and hashes it using your `APP_WEBHOOK_SECRET`.
2.  It sends this hash in the `X-Hub-Signature-256` header.
3.  The Supabase function repeats the process and compares the results.
4.  If they don't match, the request is rejected with `401 Unauthorized`.
