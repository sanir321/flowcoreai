drop policy if exists "workspace_owner_access" on workspaces;

create policy "workspace_owner_access" on workspaces
  for all
  using (owner_id = auth.uid() and deleted_at is null)
  with check (owner_id = auth.uid());
