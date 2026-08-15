-- Audit remediation: H2 + M6
-- H2: kb_sources / kb_chunks RLS policies had only USING (with `deleted_at is null`),
-- so the soft-delete UPDATE (setting deleted_at) was rejected by the implicit
-- WITH CHECK falling back to USING. Recreate with an explicit WITH CHECK so the
-- owner can soft-delete rows (old row still must match USING; new row must only
-- belong to the user's workspace).
-- M6: enforce a single active workspace per user at the DB level (partial unique
-- index) to remove the createWorkspace TOCTOU duplicate pre-check race.

alter table kb_sources disable row level security;
drop policy if exists "kb_sources_rls" on kb_sources;
alter table kb_sources enable row level security;
create policy "kb_sources_rls" on kb_sources
  using (
    workspace_id in (select id from workspaces where owner_id = auth.uid() and deleted_at is null)
    and deleted_at is null
  )
  with check (
    workspace_id in (select id from workspaces where owner_id = auth.uid() and deleted_at is null)
  );

alter table kb_chunks disable row level security;
drop policy if exists "kb_chunks_rls" on kb_chunks;
alter table kb_chunks enable row level security;
create policy "kb_chunks_rls" on kb_chunks
  using (
    workspace_id in (select id from workspaces where owner_id = auth.uid() and deleted_at is null)
    and deleted_at is null
  )
  with check (
    workspace_id in (select id from workspaces where owner_id = auth.uid() and deleted_at is null)
  );

-- M6: one active workspace per user (deleted workspaces don't count).
drop index if exists idx_workspaces_active_owner;
create unique index idx_workspaces_active_owner
  on workspaces(owner_id)
  where deleted_at is null;
