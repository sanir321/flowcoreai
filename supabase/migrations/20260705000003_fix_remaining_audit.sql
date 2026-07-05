-- Fix remaining audit findings from comprehensive review
-- See AGENTS.md for full context

-- 1. (C6) Make contacts.phone index unique so ON CONFLICT (workspace_id, phone)
--    in process_webhook_message RPC works correctly. The old index was non-unique,
--    causing "no unique or exclusion constraint" error at runtime.
drop index if exists idx_contacts_phone;
create unique index if not exists idx_contacts_phone
  on public.contacts(workspace_id, phone)
  where phone is not null and deleted_at is null;

-- 2. Drop stale unused indexes (from audit — indexes that exist but have no
--    matching query patterns or are superseded by composite indexes)
drop index if exists idx_contacts_workspace;
drop index if exists idx_billing_razorpay_order;
