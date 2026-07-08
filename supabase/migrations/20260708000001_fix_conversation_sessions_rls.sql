-- Fix RLS policy on conversation_sessions to respect soft-delete
-- The deleted_at column was added in 20260521000000_fix_missing_tables.sql
-- but the RLS policy was never updated to filter it out

drop policy if exists "conv_rls" on conversation_sessions;

create policy "conv_rls" on conversation_sessions
  using (
    workspace_id in (select id from workspaces where owner_id = auth.uid() and deleted_at is null)
    and deleted_at is null
  );
