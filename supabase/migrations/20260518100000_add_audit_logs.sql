-- Add audit_logs table
create table audit_logs (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  actor_id        uuid references auth.users(id) on delete set null,
  action          text not null, -- e.g., 'update_agent_config', 'delete_contact'
  entity_type     text not null, -- e.g., 'agent', 'contact', 'workspace'
  entity_id       uuid,          -- ID of the affected entity
  payload         jsonb not null default '{}', -- Detailed changes
  created_at      timestamptz not null default now()
);

create index idx_audit_workspace on audit_logs(workspace_id, created_at desc);

alter table audit_logs enable row level security;

create policy "audit_logs_owner_access" on audit_logs
  using (workspace_id in (select id from workspaces where owner_id = auth.uid() and deleted_at is null));
