# Edge Functions: The Orchestration Logic

FlowCore uses serverless Edge Functions to handle real-time tasks without slowing down the dashboard.

## 1. `gowa-webhook`
**Primary Role:** The "Router".
- **Trigger:** Called by GoWA whenever a message arrives.
- **Tasks:**
    1. Verify HMAC Signature.
    2. Normalize JIDs (LIDs to standard phone formats).
    3. Upsert the Contact into the directory.
    4. Find/Create an active conversation session.
    5. Save the Message to the database.
    6. Update session "Last Active" metadata.
    7. Trigger the AI Orchestrator (if inbound).

## 2. `agent-orchestrator`
**Primary Role:** The "Brain".
- **Trigger:** Called asynchronously by the webhook.
- **Tasks:**
    1. Fetch the workspace's specialized prompt and knowledge base.
    2. Construct the conversation history.
    3. Call the LLM (via Kilo.ai or OpenAI).
    4. Save the AI's response to the database.
    5. Call the GoWA API to deliver the response to the customer.

## 3. `tool-executor`
**Primary Role:** The "Action Layer".
- **Trigger:** Called by the LLM when it needs to perform a task.
- **Integrations:**
    - **Google Calendar:** List events, book appointments.
    - **Google Sheets:** Log lead data, query availability.
    - **CRM:** Export contact details.

---

## Deployment Commands
Run these from your terminal to deploy updates:

```bash
# Deploy all functions
npx supabase functions deploy

# Deploy a specific function
npx supabase functions deploy gowa-webhook

# Set secrets for functions
npx supabase secrets set GOWA_WEBHOOK_SECRET=mysecret
```
