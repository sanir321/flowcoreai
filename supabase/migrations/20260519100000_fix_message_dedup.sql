-- Fix duplicate AI responses: enforce unique constraint on gowa_message_id per workspace
-- This prevents race conditions when GoWA retries webhooks

drop index if exists idx_messages_dedup;

create unique index idx_messages_dedup on messages(gowa_message_id, workspace_id)
  where gowa_message_id is not null;
