-- Consolidate workspace_agents RLS into a single FOR ALL policy.
-- Fixes the multiple_permissive_policies performance warning: wa_workspace_rls
-- (FOR ALL, USING only, WITH CHECK NULL) plus the 20260720 owner-specific
-- INSERT/UPDATE/DELETE policies all granted the same role+action combos.
-- The single policy carries explicit USING + WITH CHECK so it covers SELECT,
-- INSERT, UPDATE, and DELETE with identical semantics to the old set.

drop policy if exists "workspace_agents_delete_owner" on public.workspace_agents;
drop policy if exists "workspace_agents_insert_owner" on public.workspace_agents;
drop policy if exists "workspace_agents_update_owner" on public.workspace_agents;

drop policy if exists "wa_workspace_rls" on public.workspace_agents;
create policy "wa_workspace_rls" on public.workspace_agents
  for all
  using (
    workspace_id in (
      select id from public.workspaces
      where owner_id = (select auth.uid())
        and deleted_at is null
    )
  )
  with check (
    workspace_id in (
      select id from public.workspaces
      where owner_id = (select auth.uid())
        and deleted_at is null
    )
  );
