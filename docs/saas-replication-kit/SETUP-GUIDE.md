# Step-by-Step Setup: Replicating FlowCore

Follow this guide to deploy the FlowCore architecture in a new project.

## Step 1: Deploy GoWA (Railway)
1.  Deploy a Docker instance of **GoWA** to Railway.
2.  Add the following **Environment Variables**:
    *   `APP_WEBHOOK`: Your Supabase Function URL (e.g., `https://[ref].supabase.co/functions/v1/gowa-webhook?apikey=[key]`)
    *   `APP_WEBHOOK_SECRET`: A secure string (e.g., `mysecret2026`)
    *   `APP_WEBHOOK_EVENTS`: `message,message.ack`
3.  **Redeploy** the service to activate the webhooks.

## Step 2: Configure Supabase
1.  **Database:** Run the SQL schema (found in `docs/04-DATABASE-SCHEMA.md`) to create the necessary tables and triggers.
2.  **Secrets:** Go to Project Settings -> Edge Functions -> Secrets and add:
    *   `GOWA_WEBHOOK_SECRET`: (Must match the one in Railway)
    *   `SUPABASE_SERVICE_ROLE_KEY`: (Your project's secret key)
    *   `GOWA_BASE_URL`: The public URL of your Railway service.
3.  **Security:** Go to Edge Functions -> `gowa-webhook` -> Settings and **Uncheck** "Enforce JWT Verification".

## Step 3: Deploy Edge Functions
1.  Deploy the `gowa-webhook` to handle incoming WhatsApp signals.
2.  Deploy the `agent-orchestrator` to handle AI logic.
3.  Deploy the `tool-executor` to handle Google Calendar/Sheets integrations.

## Step 4: Configure the Dashboard (Next.js)
1.  In your `.env.local`, set your Supabase URL, Anon Key, and Service Role Key.
2.  Add your **Google OAuth Credentials** for the Calendar/Sheets integrations.
3.  Add the **GOWA_API_KEY** to allow the dashboard to send messages.

## Step 5: The Handshake
1.  Open your new dashboard.
2.  Navigate to **Settings** -> **WhatsApp**.
3.  Scan the QR code with your phone.
4.  Once connected, the `gowa_sessions` table will automatically link your phone to that workspace.

---

## Pro Tip for New SaaS
*   **Centralized Webhook:** Always use a single public Edge Function to receive all WhatsApp traffic. Use the `device_id` (JID) in the payload to determine which workspace the message belongs to.
*   **Optimistic UI:** Don't wait for WhatsApp to confirm delivery before showing the message to the user. Show it instantly in the UI for a fast user experience.
