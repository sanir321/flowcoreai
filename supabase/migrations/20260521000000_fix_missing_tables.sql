-- Fix missing tables, columns, RPCs, and storage buckets
-- Reconciliation between migrations and live production DB

-- 1. billing_transactions (base table — razorpay migration ALTERs this)
create table if not exists public.billing_transactions (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references public.workspaces(id) on delete cascade,
  transaction_type  text not null,
  amount_credits    integer not null,
  description       text,
  amount_paid       integer,
  currency          text not null default 'INR',
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  payment_status    text not null default 'pending' check (payment_status in ('pending','success','failed')),
  created_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

create index if not exists idx_billing_razorpay_order on public.billing_transactions(razorpay_order_id) where razorpay_order_id is not null;

alter table public.billing_transactions enable row level security;
create policy if not exists "billing_tx_rls" on public.billing_transactions
  using (workspace_id in (select id from public.workspaces where owner_id = auth.uid() and deleted_at is null));

-- 2. kb_response_cache
create table if not exists public.kb_response_cache (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces(id) on delete cascade,
  cache_key       text not null,
  agent_hash      text,
  query_text      text not null,
  response_text   text not null,
  model           text,
  access_count    integer not null default 0,
  accessed_at     timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  unique(workspace_id, cache_key, agent_hash)
);

alter table public.kb_response_cache enable row level security;
create policy if not exists "kb_cache_rls" on public.kb_response_cache
  using (workspace_id in (select id from public.workspaces where owner_id = auth.uid() and deleted_at is null));

-- 3. follow_ups
create table if not exists public.follow_ups (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references public.workspaces(id) on delete cascade,
  contact_id        uuid references public.contacts(id) on delete set null,
  session_id        uuid references public.conversation_sessions(id) on delete set null,
  message_template  text not null,
  scheduled_at      timestamptz not null,
  status            text not null default 'pending' check (status in ('pending','sent','failed','cancelled')),
  sent_at           timestamptz,
  failure_reason    text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

alter table public.follow_ups enable row level security;
create policy if not exists "follow_ups_rls" on public.follow_ups
  using (workspace_id in (select id from public.workspaces where owner_id = auth.uid() and deleted_at is null));

-- 4. failed_messages
create table if not exists public.failed_messages (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces(id) on delete cascade,
  session_id      uuid references public.conversation_sessions(id) on delete set null,
  raw_message     text not null,
  failure_reason  text,
  retry_count     integer not null default 0,
  last_retried_at timestamptz,
  resolved        boolean not null default false,
  created_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

alter table public.failed_messages enable row level security;
create policy if not exists "failed_msgs_rls" on public.failed_messages
  using (workspace_id in (select id from public.workspaces where owner_id = auth.uid() and deleted_at is null));

-- 5. agent_traces
create table if not exists public.agent_traces (
  id                  uuid primary key default gen_random_uuid(),
  workspace_id        uuid not null references public.workspaces(id) on delete cascade,
  session_id          uuid not null references public.conversation_sessions(id) on delete cascade,
  trace_id            text not null,
  model_used          text,
  intent_detected     text,
  tokens_used         integer,
  latency_ms          integer,
  response_length     integer,
  message_length      integer,
  grounding_score     numeric,
  guardrail_blocked   boolean not null default false,
  fallback_used       boolean not null default false,
  escalation_triggered boolean not null default false,
  circuit_breaker_open boolean not null default false,
  created_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

alter table public.agent_traces enable row level security;
create policy if not exists "agent_traces_rls" on public.agent_traces
  using (workspace_id in (select id from public.workspaces where owner_id = auth.uid() and deleted_at is null));

-- 6. menu_items
create table if not exists public.menu_items (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  name          text not null,
  description   text,
  price         numeric not null,
  category      text,
  image_url     text,
  is_available  boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

alter table public.menu_items enable row level security;
create policy if not exists "menu_items_rls" on public.menu_items
  using (workspace_id in (select id from public.workspaces where owner_id = auth.uid() and deleted_at is null));

-- 7. orders
create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces(id) on delete cascade,
  contact_id      uuid references public.contacts(id) on delete set null,
  session_id      uuid references public.conversation_sessions(id) on delete set null,
  order_number    text,
  items           jsonb not null default '[]'::jsonb,
  subtotal        numeric,
  tax             numeric,
  total           numeric,
  status          text not null default 'pending',
  upi_link        text,
  payment_method  text,
  payment_ref     text,
  currency        text not null default 'INR',
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

alter table public.orders enable row level security;
create policy if not exists "orders_rls" on public.orders
  using (workspace_id in (select id from public.workspaces where owner_id = auth.uid() and deleted_at is null));

-- 8. quotes
create table if not exists public.quotes (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces(id) on delete cascade,
  contact_id      uuid references public.contacts(id) on delete set null,
  quote_number    text,
  items           jsonb not null default '[]'::jsonb,
  subtotal        numeric,
  tax             numeric,
  total           numeric,
  status          text not null default 'draft',
  notes           text,
  sent_at         timestamptz,
  valid_until     text,
  currency        text not null default 'INR',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

alter table public.quotes enable row level security;
create policy if not exists "quotes_rls" on public.quotes
  using (workspace_id in (select id from public.workspaces where owner_id = auth.uid() and deleted_at is null));

-- 9. menu_media
create table if not exists public.menu_media (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  file_path     text not null,
  file_type     text not null,
  file_name     text not null,
  created_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

alter table public.menu_media enable row level security;
create policy if not exists "menu_media_rls" on public.menu_media
  using (workspace_id in (select id from public.workspaces where owner_id = auth.uid() and deleted_at is null));

-- 10. Missing columns on workspaces
alter table public.workspaces add column if not exists plan_type text;
alter table public.workspaces add column if not exists owner_personal_phone text;
alter table public.workspaces add column if not exists credits_balance integer not null default 0;
alter table public.workspaces add column if not exists guardrail_config jsonb not null default '{}'::jsonb;
alter table public.workspaces add column if not exists welcome_template text;
alter table public.workspaces add column if not exists upi_id text;

-- 11. Missing columns on contacts
alter table public.contacts add column if not exists last_followed_up_at timestamptz;
alter table public.contacts add column if not exists lead_score integer;
alter table public.contacts add column if not exists lead_source text;
alter table public.contacts add column if not exists pipeline_stage text;

-- 12. Missing columns on conversation_sessions
alter table public.conversation_sessions add column if not exists active_agent text;
alter table public.conversation_sessions add column if not exists failed_attempts integer not null default 0;
alter table public.conversation_sessions add column if not exists last_message_preview text;
alter table public.conversation_sessions add column if not exists last_intent text;
alter table public.conversation_sessions add column if not exists typing_status text;
alter table public.conversation_sessions add column if not exists pending_confirmation jsonb;
alter table public.conversation_sessions add column if not exists handoff_at timestamptz;
alter table public.conversation_sessions add column if not exists handoff_reason text;
alter table public.conversation_sessions add column if not exists resolved_by text;
alter table public.conversation_sessions add column if not exists total_tokens_used integer not null default 0;
alter table public.conversation_sessions add column if not exists booking_data jsonb;
alter table public.conversation_sessions add column if not exists deleted_at timestamptz;

-- 13. Missing columns on appointments
alter table public.appointments add column if not exists customer_email text;
alter table public.appointments add column if not exists meeting_link text;

-- 14. Missing columns on messages
alter table public.messages add column if not exists deleted_at timestamptz;

-- 15. Missing RPC: decrement_credits (called from orchestrator with 3 params)
create or replace function public.decrement_credits(
  p_workspace_id uuid,
  p_credits integer,
  p_session_id uuid
)
returns void
language plpgsql
security definer
as $$
begin
  update public.workspaces
  set credits_balance = credits_balance - p_credits
  where id = p_workspace_id;
end;
$$;

-- 16. Missing RPC: get_workspace_health
create or replace function public.get_workspace_health(p_workspace_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_health jsonb;
begin
  select jsonb_build_object(
    'credits', credits_balance,
    'is_active', deleted_at is null
  ) into v_health
  from public.workspaces
  where id = p_workspace_id;
  return v_health;
end;
$$;

-- 17. Missing view: ai_performance_report
create or replace view public.ai_performance_report as
select
  ats.workspace_id,
  count(ats.id) as total_traces,
  avg(ats.latency_ms)::integer as avg_latency,
  count(*) filter (where ats.guardrail_blocked) as block_count,
  count(*) filter (where ats.fallback_used) as fallback_count,
  count(*) filter (where not ats.escalation_triggered and not ats.guardrail_blocked) as ai_resolutions,
  case when count(*) > 0
    then round(100.0 * count(*) filter (where not ats.escalation_triggered and not ats.guardrail_blocked) / count(*), 1)
    else 0
  end as ai_resolution_rate_pct
from public.agent_traces ats
group by ats.workspace_id;

-- 18. Missing storage bucket for menu media
insert into storage.buckets (id, name, public)
values ('menu-media', 'menu-media', true)
on conflict (id) do nothing;

create policy if not exists "menu_media_public_read" on storage.objects for select
  using (bucket_id = 'menu-media');

create policy if not exists "menu_media_owner_write" on storage.objects for insert
  with check (
    bucket_id = 'menu-media'
    and (storage.foldername(name))[1] in (
      select w.id::text from public.workspaces w where w.owner_id = auth.uid()
    )
  );

create policy if not exists "menu_media_owner_delete" on storage.objects for delete
  using (
    bucket_id = 'menu-media'
    and (storage.foldername(name))[1] in (
      select w.id::text from public.workspaces w where w.owner_id = auth.uid()
    )
  );

-- 19. booking_sessions (replaces JSONB booking state in conversation_state)
create table if not exists public.booking_sessions (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references public.conversation_sessions(id) on delete cascade,
  workspace_id    uuid not null references public.workspaces(id) on delete cascade,
  state           text not null default 'idle'
    check (state in ('idle','collecting_service','collecting_date','collecting_time',
           'collecting_name','collecting_email','confirming','booked','cancelled')),
  collected       jsonb not null default '{}'::jsonb,
  attempts        jsonb not null default '{}'::jsonb,
  appointment_id  uuid references public.appointments(id) on delete set null,
  deleted_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_booking_sessions_session on public.booking_sessions(session_id);
create index if not exists idx_booking_sessions_workspace on public.booking_sessions(workspace_id);
create unique index if not exists one_active_booking_per_session on public.booking_sessions(session_id) where deleted_at is null;

alter table public.booking_sessions enable row level security;
create policy if not exists "booking_sessions_rls" on public.booking_sessions
  using (workspace_id in (select id from public.workspaces where owner_id = auth.uid() and deleted_at is null));

create or replace function public.lock_booking_session(p_session_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  perform 1 from public.booking_sessions
  where session_id = p_session_id and deleted_at is null
  for update nowait;
end;
$$;

-- 20. pending_replies (draft/approval mode)
create table if not exists public.pending_replies (
  id                  uuid primary key default gen_random_uuid(),
  workspace_id        uuid not null references public.workspaces(id) on delete cascade,
  session_id          uuid references public.conversation_sessions(id) on delete cascade,
  generated_response  text not null,
  edited_response     text,
  status              text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'auto_sent')),
  reviewed_by         uuid,
  reviewed_at         timestamptz,
  created_at          timestamptz not null default now()
);

create index if not exists idx_pending_replies_workspace on public.pending_replies(workspace_id, status);

alter table public.pending_replies enable row level security;
create policy if not exists "pending_replies_rls" on public.pending_replies
  using (workspace_id in (select id from public.workspaces where owner_id = auth.uid() and deleted_at is null));

-- 21. require_approval on workspaces (for draft/approval gate)
alter table public.workspaces add column if not exists require_approval boolean not null default false;

-- 22. status on messages (for pending/approved/rejected tracking)
alter table public.messages add column if not exists status text not null default 'sent'
  check (status in ('sent', 'pending', 'rejected'));
