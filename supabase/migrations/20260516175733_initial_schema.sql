-- FlowCore AI - Initial Schema
-- Auto-generated from docs/04-DATABASE-SCHEMA.md

-- 0. Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgvector";

-- 1. Workspace & Tenant

create table workspaces (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  business_type   text,
  website_url     text,
  employee_count  text,
  description     text,
  logo_url        text,
  timezone        text not null default 'Asia/Kolkata',
  plan            text not null default 'trial',
  status          text not null default 'active',
  is_ai_enabled   boolean not null default true,
  safety_pin_hash text,
  owner_id        uuid not null references auth.users(id) on delete cascade,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create index idx_workspaces_owner on workspaces(owner_id);
create index idx_workspaces_active on workspaces(owner_id) where deleted_at is null;

alter table workspaces enable row level security;
create policy "workspace_owner_access" on workspaces
  using (owner_id = auth.uid() and deleted_at is null);

-- workspace_agents
create table workspace_agents (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  agent_type      text not null check (agent_type in ('customer_support','appointment_booking','sales')),
  status          text not null default 'active' check (status in ('active','paused')),
  config          jsonb not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  unique(workspace_id, agent_type)
);

create index idx_wa_workspace on workspace_agents(workspace_id);

alter table workspace_agents enable row level security;
create policy "wa_workspace_rls" on workspace_agents
  using (workspace_id in (select id from workspaces where owner_id = auth.uid() and deleted_at is null));

-- workspace_notifications
create table workspace_notifications (
  workspace_id              uuid primary key references workspaces(id) on delete cascade,
  email_on_escalation       boolean not null default true,
  email_on_booking          boolean not null default false,
  email_on_lead             boolean not null default false,
  whatsapp_alert_number     text,
  notification_mode         text not null default 'instant'
                            check (notification_mode in ('instant','digest','off')),
  updated_at                timestamptz not null default now()
);

alter table workspace_notifications enable row level security;
create policy "notif_rls" on workspace_notifications
  using (workspace_id in (select id from workspaces where owner_id = auth.uid() and deleted_at is null));

-- 2. Knowledge Base

create table kb_sources (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  agent_id        uuid references workspace_agents(id) on delete cascade,
  source_type     text not null check (source_type in ('url','pdf','docx','txt')),
  label           text not null,
  url             text,
  storage_path    text,
  status          text not null default 'pending'
                  check (status in ('pending','processing','active','failed')),
  chunk_count     integer not null default 0,
  error_message   text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create index idx_kb_sources_workspace on kb_sources(workspace_id) where deleted_at is null;
create index idx_kb_sources_status on kb_sources(workspace_id, status) where deleted_at is null;

alter table kb_sources enable row level security;
create policy "kb_sources_rls" on kb_sources
  using (
    workspace_id in (select id from workspaces where owner_id = auth.uid() and deleted_at is null)
    and deleted_at is null
  );

create table kb_chunks (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  source_id       uuid not null references kb_sources(id) on delete cascade,
  content         text not null,
  embedding       vector(384),
  token_count     integer,
  chunk_index     integer not null,
  metadata        jsonb not null default '{}',
  created_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create index idx_kb_chunks_workspace on kb_chunks(workspace_id) where deleted_at is null;
create index idx_kb_chunks_source on kb_chunks(source_id) where deleted_at is null;
create index idx_kb_chunks_hnsw on kb_chunks
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

alter table kb_chunks enable row level security;
create policy "kb_chunks_rls" on kb_chunks
  using (
    workspace_id in (select id from workspaces where owner_id = auth.uid() and deleted_at is null)
    and deleted_at is null
  );

-- 3. GoWA Sessions
create table gowa_sessions (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references workspaces(id) on delete cascade,
  gowa_session_id   text not null unique,
  phone_jid         text,
  display_name      text,
  status            text not null default 'disconnected'
                    check (status in ('disconnected','qr_pending','connected','error')),
  last_seen_at      timestamptz,
  error_message     text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique(workspace_id)
);

create index idx_gowa_session_lookup on gowa_sessions(gowa_session_id);

alter table gowa_sessions enable row level security;
create policy "gowa_rls" on gowa_sessions
  using (workspace_id in (select id from workspaces where owner_id = auth.uid() and deleted_at is null));

-- 4. Contacts
create table contacts (
  id                  uuid primary key default gen_random_uuid(),
  workspace_id        uuid not null references workspaces(id) on delete cascade,
  whatsapp_jid        text,
  session_token       text,
  phone               text,
  name                text,
  email               text,
  channel             text not null default 'whatsapp'
                      check (channel in ('whatsapp','widget')),
  tags                text[] not null default '{}',
  notes               text,
  first_contact       timestamptz not null default now(),
  last_active         timestamptz,
  conversation_count  integer not null default 0,
  merged_into         uuid references contacts(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

create unique index idx_contacts_jid on contacts(workspace_id, whatsapp_jid)
  where whatsapp_jid is not null and deleted_at is null;
create unique index idx_contacts_token on contacts(workspace_id, session_token)
  where session_token is not null and deleted_at is null;
create index idx_contacts_phone on contacts(workspace_id, phone)
  where phone is not null and deleted_at is null;
create index idx_contacts_workspace on contacts(workspace_id) where deleted_at is null;

alter table contacts enable row level security;
create policy "contacts_rls" on contacts
  using (
    workspace_id in (select id from workspaces where owner_id = auth.uid() and deleted_at is null)
    and deleted_at is null
  );

-- 5. Conversations & Messages
create table conversation_sessions (
  id                          uuid primary key default gen_random_uuid(),
  workspace_id                uuid not null references workspaces(id) on delete cascade,
  contact_id                  uuid references contacts(id) on delete set null,
  agent_type                  text check (agent_type in ('customer_support','appointment_booking','sales')),
  channel                     text not null check (channel in ('whatsapp','widget')),
  customer_jid                text,
  customer_name               text,
  status                      text not null default 'active'
                              check (status in ('active','escalated','resolved','idle')),
  is_test                     boolean not null default false,
  message_count               integer not null default 0,
  last_message_at             timestamptz,
  last_customer_message_at    timestamptz,
  metadata                    jsonb not null default '{}',
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index idx_conv_workspace on conversation_sessions(workspace_id, last_message_at desc);
create index idx_conv_jid on conversation_sessions(workspace_id, customer_jid);
create index idx_conv_status on conversation_sessions(workspace_id, status);
create index idx_conv_window on conversation_sessions(workspace_id, last_customer_message_at)
  where status = 'active';

alter table conversation_sessions enable row level security;
create policy "conv_rls" on conversation_sessions
  using (workspace_id in (select id from workspaces where owner_id = auth.uid() and deleted_at is null));

create table messages (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references workspaces(id) on delete cascade,
  session_id        uuid not null references conversation_sessions(id) on delete cascade,
  direction         text not null check (direction in ('inbound','outbound')),
  role              text not null check (role in ('customer','agent','system')),
  content           text not null,
  gowa_message_id   text,
  agent_type        text,
  is_test           boolean not null default false,
  metadata          jsonb not null default '{}',
  created_at        timestamptz not null default now()
);

create index idx_messages_session on messages(session_id, created_at);
create index idx_messages_workspace on messages(workspace_id, created_at desc);
create index idx_messages_dedup on messages(gowa_message_id)
  where gowa_message_id is not null;

alter table messages enable row level security;
create policy "messages_rls" on messages
  using (workspace_id in (select id from workspaces where owner_id = auth.uid() and deleted_at is null));

-- 6. Appointments
create table appointments (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references workspaces(id) on delete cascade,
  session_id        uuid references conversation_sessions(id) on delete set null,
  contact_id        uuid references contacts(id) on delete set null,
  google_event_id   text,
  customer_name     text not null,
  customer_phone    text,
  service           text,
  start_at          timestamptz not null,
  end_at            timestamptz not null,
  status            text not null default 'confirmed'
                    check (status in ('confirmed','pending','cancelled','rescheduled')),
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

create index idx_appts_workspace on appointments(workspace_id, start_at) where deleted_at is null;
create index idx_appts_status on appointments(workspace_id, status) where deleted_at is null;

alter table appointments enable row level security;
create policy "appts_rls" on appointments
  using (
    workspace_id in (select id from workspaces where owner_id = auth.uid() and deleted_at is null)
    and deleted_at is null
  );

-- 7. Escalation Logs
create table escalation_logs (
  id                        uuid primary key default gen_random_uuid(),
  workspace_id              uuid not null references workspaces(id) on delete cascade,
  session_id                uuid not null references conversation_sessions(id) on delete cascade,
  trigger_type              text not null
                            check (trigger_type in (
                              'customer_request','guardrail_hit','low_confidence',
                              'wa_window_expired','timeout'
                            )),
  trigger_message           text,
  conversation_snapshot     jsonb not null,
  status                    text not null default 'open'
                            check (status in ('open','resolved')),
  resolved_by               uuid references auth.users(id),
  resolved_at               timestamptz,
  notes                     text,
  notification_sent         boolean not null default false,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index idx_esc_workspace on escalation_logs(workspace_id, status);
create index idx_esc_session on escalation_logs(session_id);

alter table escalation_logs enable row level security;
create policy "esc_rls" on escalation_logs
  using (workspace_id in (select id from workspaces where owner_id = auth.uid() and deleted_at is null));

-- 8. Google OAuth Tokens
create table google_oauth_tokens (
  workspace_id      uuid primary key references workspaces(id) on delete cascade,
  access_token      text not null,
  refresh_token     text not null,
  token_expiry      timestamptz not null,
  scopes            text[] not null,
  google_email      text,
  calendar_id       text not null default 'primary',
  sheet_id          text,
  sheet_range       text not null default 'Sheet1!A:H',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table google_oauth_tokens enable row level security;
create policy "google_tokens_rls" on google_oauth_tokens
  using (workspace_id in (select id from workspaces where owner_id = auth.uid() and deleted_at is null));

-- 9. Widget Config
create table widget_config (
  workspace_id      uuid primary key references workspaces(id) on delete cascade,
  accent_color      text not null default '#4169ff',
  greeting          text not null default 'Hi! How can I help you today?',
  theme             text not null default 'dark'
                    check (theme in ('light','dark','auto')),
  allowed_domains   text[],
  avatar_url        text,
  updated_at        timestamptz not null default now()
);

alter table widget_config enable row level security;
create policy "widget_config_rls" on widget_config
  using (workspace_id in (select id from workspaces where owner_id = auth.uid() and deleted_at is null));

-- 10. Ingestion Jobs
create table ingestion_jobs (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  source_id       uuid not null references kb_sources(id) on delete cascade,
  status          text not null default 'queued'
                  check (status in ('queued','running','completed','failed')),
  attempts        integer not null default 0,
  max_attempts    integer not null default 3,
  error_message   text,
  started_at      timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz not null default now()
);

create index idx_ingestion_pending on ingestion_jobs(status, created_at)
  where status in ('queued','running');

alter table ingestion_jobs enable row level security;
create policy "ingestion_rls" on ingestion_jobs
  using (workspace_id in (select id from workspaces where owner_id = auth.uid() and deleted_at is null));

-- 11. Rate Limits
create table rate_limits (
  id                uuid primary key default gen_random_uuid(),
  ip                text not null,
  created_at        timestamptz not null default now()
);

create index idx_rate_limits_ip_time on rate_limits(ip, created_at desc);

alter table rate_limits enable row level security;

-- 12. Triggers
create or replace function set_updated_at()
returns trigger language plpgsql as \$\$
begin new.updated_at = now(); return new; end;
\$\$;

-- 13. Storage Buckets
insert into storage.buckets (id, name, public) values
  ('kb-documents', 'kb-documents', false),
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "kb_docs_tenant" on storage.objects for all
  using (bucket_id = 'kb-documents'
    and exists (
      select 1 from workspaces w
      where w.id::text = (storage.foldername(name))[1]
      and w.owner_id = auth.uid()
      and w.deleted_at is null
    ));

create policy "avatars_public_read" on storage.objects for select
  using (bucket_id = 'avatars');
create policy "avatars_owner_write" on storage.objects for insert
  with check (bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text);

-- Vector search RPC for knowledge base chunks
create or replace function match_kb_chunks(
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  p_workspace_id uuid default null
)
returns table(id uuid, content text, similarity float)
language plpgsql
as $$
begin
  return query
  select kc.id, kc.content, 1 - (kc.embedding <=> query_embedding) as similarity
  from public.kb_chunks kc
  join public.kb_sources ks on ks.id = kc.source_id
  where (p_workspace_id is null or kc.workspace_id = p_workspace_id)
    and kc.deleted_at is null
    and ks.deleted_at is null
    and ks.status = 'active'
    and (kc.embedding <=> query_embedding) < 1 - match_threshold
  order by kc.embedding <=> query_embedding
  limit match_count;
end;
$$;
