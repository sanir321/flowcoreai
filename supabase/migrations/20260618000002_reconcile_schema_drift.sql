-- Schema reconciliation migration
-- Documents columns that were added directly to the database (via dashboard/psql)
-- without corresponding migration files. Uses IF NOT EXISTS to be idempotent.

-- =====================
-- 1. workspaces drift
-- =====================
alter table workspaces
  add column if not exists business_profile jsonb not null default '{}'::jsonb,
  add column if not exists services_offered text,
  add column if not exists kb_config jsonb not null default '{"match_count":3,"match_threshold":0.35,"chunk_truncation":800,"noise_stripping":true}'::jsonb,
  add column if not exists safety_pin_hash text;

-- =====================
-- 2. widget_config drift
-- =====================
alter table widget_config
  add column if not exists enable_whatsapp boolean not null default false,
  add column if not exists default_country text not null default 'IN',
  add column if not exists is_active boolean not null default true,
  add column if not exists whatsapp_number text;

-- =====================
-- 3. conversation_sessions drift
-- =====================
alter table conversation_sessions
  add column if not exists working_context jsonb,
  add column if not exists active_agent text,
  add column if not exists handoff_at timestamptz,
  add column if not exists last_intent text,
  add column if not exists pending_confirmation jsonb;

-- =====================
-- 4. audit_logs drift
-- =====================
alter table audit_logs
  add column if not exists ip_address text,
  add column if not exists user_agent text;

-- =====================
-- 5. appointments drift
-- =====================
alter table appointments
  add column if not exists sync_status text;

-- =====================
-- 6. contacts drift (migration added columns that didn't materialize)
-- =====================
alter table contacts
  add column if not exists merged_into uuid references contacts(id),
  add column if not exists last_followed_up_at timestamptz,
  add column if not exists lead_score integer,
  add column if not exists lead_source text,
  add column if not exists pipeline_stage text not null default 'new';

-- =====================
-- 7. billing_transactions - add missing razorpay columns
-- =====================
alter table billing_transactions
  add column if not exists amount_paid integer,
  add column if not exists currency text not null default 'INR',
  add column if not exists razorpay_order_id text,
  add column if not exists razorpay_payment_id text,
  add column if not exists razorpay_signature text,
  add column if not exists payment_status text not null default 'pending';

-- =====================
-- 8. Fix failed_messages column type (migration said text, DB has jsonb)
-- =====================
-- Need to handle this carefully: if column is text, convert to jsonb
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'failed_messages'
    and column_name = 'raw_message' and data_type = 'text'
  ) then
    alter table failed_messages alter column raw_message type jsonb using raw_message::jsonb;
  end if;
end $$;

-- =====================
-- 9. Callback queue - add RLS policy (currently RLS enabled with no policy)
-- =====================
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'callback_queue_service_role_only' and tablename = 'callback_queue') then
    create policy "callback_queue_service_role_only" on callback_queue for all using (auth.role() = 'service_role');
  end if;
end $$;

-- =====================
-- 10. Rate limits - add RLS policy (currently RLS enabled with no policy)
-- =====================
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'rate_limits_service_role_only' and tablename = 'rate_limits') then
    create policy "rate_limits_service_role_only" on rate_limits for all using (auth.role() = 'service_role');
  end if;
end $$;

-- =====================
-- 11. Waitlist - add RLS policy (currently RLS enabled with no policy)
-- =====================
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'waitlist_public_insert' and tablename = 'waitlist') then
    create policy "waitlist_public_insert" on waitlist for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'waitlist_admin_only' and tablename = 'waitlist') then
    create policy "waitlist_admin_only" on waitlist for all using (auth.role() = 'service_role');
  end if;
end $$;
