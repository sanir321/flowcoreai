-- Fix: Add INSERT policy for workspace_agents
-- The table only had a public SELECT policy, blocking user JWT inserts during onboarding
CREATE POLICY "workspace_agents_insert_owner" ON workspace_agents
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces
      WHERE owner_id = (SELECT auth.uid())
        AND deleted_at IS NULL
    )
  );

-- Fix: Add UPDATE and DELETE policies for workspace_agents (owner management)
CREATE POLICY "workspace_agents_update_owner" ON workspace_agents
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT id FROM workspaces
      WHERE owner_id = (SELECT auth.uid())
        AND deleted_at IS NULL
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces
      WHERE owner_id = (SELECT auth.uid())
        AND deleted_at IS NULL
    )
  );

CREATE POLICY "workspace_agents_delete_owner" ON workspace_agents
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT id FROM workspaces
      WHERE owner_id = (SELECT auth.uid())
        AND deleted_at IS NULL
    )
  );

-- Verify: Re-check workspaces INSERT works via the existing FOR ALL policy.
-- The existing "workspace_owner_access" policy uses FOR ALL with:
--   USING (owner_id = (SELECT auth.uid()) AND deleted_at IS NULL)
-- For INSERT this acts as WITH CHECK, which should pass since the server action
-- sets owner_id = auth.uid(). No additional policy needed.
