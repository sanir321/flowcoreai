# 04 — Database Schema
## FlowCore AI — Supabase PostgreSQL Schema v3.0

**Engine:** PostgreSQL 15 + pgvector
**Auth:** Supabase Auth (`auth.users`)
**Isolation:** RLS on every tenant table — no exceptions
**Vector Index:** HNSW exclusively (no IVFFlat)
**RLS policy rule:** All content-table policies MUST include `AND deleted_at IS NULL`

---

## 0. Conventions

- All PKs: `uuid` default `gen_random_uuid()`
- All timestamps: `timestamptz`, UTC
- Tenant tables carry: `workspace_id uuid not null references workspaces(id) on delete cascade`
- `created_at`: `not null default now()`
- `updated_at`: maintained via trigger
- Soft delete: `deleted_at timestamptz null` — MUST be checked in all RLS `USING` clauses on affected tables

---

## 1. Workspace & Tenant

### `workspaces`

```sql
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
  safety_pin_hash text, -- 4-digit PIN for Danger Zone actions
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
```

### `workspace_agents`

```sql
create table workspace_agents (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  agent_type      text not null check (agent_type in ('customer_support','appointment_booking','sales')),
  status          text not null default 'active' check (status in ('active','paused')),
  config          jsonb not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(workspace_id, agent_type)
);

create index idx_wa_workspace on workspace_agents(workspace_id);

alter table workspace_agents enable row level security;
create policy "wa_workspace_rls" on workspace_agents
  using (workspace_id in (select id from workspaces where owner_id = auth.uid() and deleted_at is null));
```

**`config` JSONB structure by agent type:**

```jsonc
// customer_support
{
  "agent_name": "Support Assistant",
  "persona": "You are a helpful support agent for {business_name}...",
  "language": "English",
  "response_style": "friendly",     // "formal" | "friendly" | "concise"
  "guardrails": [],
  "escalation_triggers": ["customer_request","guardrail_hit","low_confidence"],
  "confidence_threshold": 0.5
}
// appointment_booking
{
  "agent_name": "Booking Assistant",
  "persona": "...",
  "language": "English",
  "available_hours": { "mon": ["09:00","18:00"], "tue": null, ... },
  "appointment_duration_mins": 30,
  "buffer_mins": 10,
  "services": [],
  "confirmation_message": "Your appointment is confirmed for {datetime}.",
  "guardrails": [],
  "escalation_triggers": ["customer_request","guardrail_hit"],
  "confidence_threshold": 0.4
}
// sales
{
  "agent_name": "Sales Assistant",
  "persona": "...",
  "language": "English",
  "qualification_questions": [],
  "followup_delay_hours": 24,
  "guardrails": [],
  "escalation_triggers": ["customer_request","guardrail_hit"],
  "confidence_threshold": 0.4
}
```

### `workspace_notifications`

```sql
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
```

---

## 2. Knowledge Base

### `kb_sources`

```sql
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
```

### `kb_chunks`

**HNSW index is mandatory. IVFFlat is prohibited.**

IVFFlat requires a minimum number of rows to build (and has cold-start accuracy drops on small corpora). HNSW builds incrementally and maintains accuracy at all dataset sizes — critical for early-stage tenants with small knowledge bases.

```sql
create table kb_chunks (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  source_id       uuid not null references kb_sources(id) on delete cascade,
  content         text not null,
  embedding       vector(1536),
  token_count     integer,
  chunk_index     integer not null,
  metadata        jsonb not null default '{}',
  created_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create index idx_kb_chunks_workspace on kb_chunks(workspace_id) where deleted_at is null;
create index idx_kb_chunks_source on kb_chunks(source_id) where deleted_at is null;

-- HNSW index: m=16, ef_construction=64 (good balance of build speed and recall accuracy)
create index idx_kb_chunks_hnsw on kb_chunks
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

alter table kb_chunks enable row level security;
create policy "kb_chunks_rls" on kb_chunks
  using (
    workspace_id in (select id from workspaces where owner_id = auth.uid() and deleted_at is null)
    and deleted_at is null
  );
```

**Vector search query (used inside `search_knowledge_base` Native Tool handler):**
```sql
select content, 1 - (embedding <=> $1::vector) as similarity
from kb_chunks
where workspace_id = $2
  and deleted_at is null
order by embedding <=> $1::vector
limit $3;
```

The `deleted_at is null` predicate is in the query AND in the RLS policy for defense in depth.

---

## 3. GoWA Sessions

```sql
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
```

---

## 4. Contacts

Auto-created on first inbound message. Central deduplication target.

```sql
create table contacts (
  id                  uuid primary key default gen_random_uuid(),
  workspace_id        uuid not null references workspaces(id) on delete cascade,
  whatsapp_jid        text,
  session_token       text,               -- Widget anonymous identifier
  phone               text,               -- E.164, normalised
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
                                          -- Points to surviving record after dedup merge
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

-- Unique constraints for dedup logic
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
```

---

## 5. Conversations & Messages

### `conversation_sessions`

```sql
create table conversation_sessions (
  id                          uuid primary key default gen_random_uuid(),
  workspace_id                uuid not null references workspaces(id) on delete cascade,
  contact_id                  uuid references contacts(id) on delete set null,
  agent_type                  text check (agent_type in ('customer_support','appointment_booking','sales')),
  channel                     text not null check (channel in ('whatsapp','widget')),
  customer_jid                text,        -- WA JID or widget session_token
  customer_name               text,
  status                      text not null default 'active'
                              check (status in ('active','escalated','resolved','idle')),
  is_test                     boolean not null default false,
  message_count               integer not null default 0,
  last_message_at             timestamptz,
  last_customer_message_at    timestamptz, -- 24-hour window check target
  metadata                    jsonb not null default '{}',
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index idx_conv_workspace on conversation_sessions(workspace_id, last_message_at desc);
create index idx_conv_jid on conversation_sessions(workspace_id, customer_jid);
create index idx_conv_status on conversation_sessions(workspace_id, status);
create index idx_conv_window on conversation_sessions(workspace_id, last_customer_message_at)
  where status = 'active';  -- Supports 24-hour window expiry queries

alter table conversation_sessions enable row level security;
create policy "conv_rls" on conversation_sessions
  using (workspace_id in (select id from workspaces where owner_id = auth.uid() and deleted_at is null));
```

### `messages`

```sql
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
                    -- { intent, confidence, kb_chunks_used, tools_called, latency_ms, typing_delay_ms }
  created_at        timestamptz not null default now()
);

create index idx_messages_session on messages(session_id, created_at);
create index idx_messages_workspace on messages(workspace_id, created_at desc);
create index idx_messages_dedup on messages(gowa_message_id)
  where gowa_message_id is not null;

alter table messages enable row level security;
create policy "messages_rls" on messages
  using (workspace_id in (select id from workspaces where owner_id = auth.uid() and deleted_at is null));
```

---

## 6. Appointments

```sql
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
```

---

## 7. Escalation Logs

```sql
create table escalation_logs (
  id                        uuid primary key default gen_random_uuid(),
  workspace_id              uuid not null references workspaces(id) on delete cascade,
  session_id                uuid not null references conversation_sessions(id) on delete cascade,
  trigger_type              text not null
                            check (trigger_type in (
                              'customer_request',
                              'guardrail_hit',
                              'low_confidence',
                              'wa_window_expired',
                              'timeout'
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

-- Note: no deleted_at on escalation_logs — these are audit records, never soft-deleted.
create index idx_esc_workspace on escalation_logs(workspace_id, status);
create index idx_esc_session on escalation_logs(session_id);

alter table escalation_logs enable row level security;
create policy "esc_rls" on escalation_logs
  using (workspace_id in (select id from workspaces where owner_id = auth.uid() and deleted_at is null));
```

---

## 8. Google OAuth Tokens

```sql
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
```

---

## 9. Widget Config

```sql
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
```

---

## 10. Ingestion Jobs

```sql
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
```

---

## 11. Rate Limits

```sql
create table rate_limits (
  id                uuid primary key default gen_random_uuid(),
  ip                text not null,
  created_at        timestamptz not null default now()
);

create index idx_rate_limits_ip_time on rate_limits(ip, created_at desc);

alter table rate_limits enable row level security;
-- No RLS policies needed as this is an internal audit/limit table used by service role
```

---

## 12. Schema Dependency Map

```
auth.users
  └─► workspaces (owner_id)
        ├─► workspace_agents           (1:many, unique per type)
        │     └─► kb_sources → kb_chunks + ingestion_jobs
        ├─► workspace_notifications    (1:1)
        ├─► gowa_sessions              (1:1)
        ├─► widget_config              (1:1)
        ├─► google_oauth_tokens        (1:1)
        ├─► contacts
        │     └─► conversation_sessions   (contact_id FK)
        │           ├─► messages
        │           ├─► escalation_logs
        │           └─► appointments
        └─► all tables cascade delete on workspace delete
```

---

## 12. Triggers

```sql
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- Apply to: workspaces, workspace_agents, workspace_notifications,
--           gowa_sessions, widget_config, google_oauth_tokens,
--           contacts, conversation_sessions, appointments, escalation_logs
create trigger trg_<table>_updated_at
  before update on <table>
  for each row execute function set_updated_at();
```

---

## 13. HNSW Index Tuning Notes

| Parameter | Value | Rationale |
|---|---|---|
| `m` | 16 | Number of bi-directional links per Agent. Higher = better recall, more memory. 16 is the standard default. |
| `ef_construction` | 64 | Size of the dynamic candidate list during index build. Higher = better recall, slower build. 64 is adequate for corpora under 500k chunks. |
| `ef_search` (query time) | 40 | Set via `SET hnsw.ef_search = 40` per session or in the Native Tool handler query. Controls recall vs latency tradeoff at query time. |

HNSW advantages over IVFFlat for this use case:
- No minimum row count required to build (IVFFlat needs `lists * 32` minimum rows)
- No accuracy cliff for small per-tenant corpora (each tenant's KB starts small)
- Incremental insert — no periodic `VACUUM` + rebuild required

---

## 14. RLS Audit Check

Run after every migration to verify no table has been left unprotected:

```sql
select tablename
from pg_tables
where schemaname = 'public'
  and rowsecurity = false;
-- Expected result: 0 rows
```

---

## 15. Storage Buckets

```sql
insert into storage.buckets (id, name, public) values
  ('kb-documents', 'kb-documents', false),
  ('avatars', 'avatars', true);

create policy "kb_docs_tenant" on storage.objects for all
  using (bucket_id = 'kb-documents'
    and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_public_read" on storage.objects for select
  using (bucket_id = 'avatars');
create policy "avatars_owner_write" on storage.objects for insert
  with check (bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text);
```

Paths: `kb-documents/{workspace_id}/{source_id}/{filename}` · `avatars/{user_id}/avatar`
