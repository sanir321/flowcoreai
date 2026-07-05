-- 1. Notifications RLS: workspace-based policy (same tenant-isolation pattern as other tables)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_workspace_rls" ON notifications
  FOR ALL USING (
    workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid() AND deleted_at IS NULL)
  );

-- 2. Missing index on conversation_sessions.contact_id (frequent lookup)
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_contact_id
  ON conversation_sessions(contact_id)
  WHERE deleted_at IS NULL;

-- 3. total_tokens_used: integer → bigint (prevents overflow on busy sessions)
ALTER TABLE conversation_sessions
  ALTER COLUMN total_tokens_used TYPE bigint USING total_tokens_used::bigint;

-- 5. RLS for required_info_templates: scope by workspace business_type
DROP POLICY IF EXISTS "templates_authenticated_read" ON required_info_templates;
CREATE POLICY "templates_business_type_scope" ON required_info_templates
  FOR SELECT USING (
    business_type IN (SELECT business_type FROM workspaces WHERE owner_id = auth.uid() AND deleted_at IS NULL)
  );

-- 6. Backfill notifications.workspace_id for pre-migration rows using session FK
UPDATE notifications n
  SET workspace_id = cs.workspace_id
  FROM conversation_sessions cs
  WHERE n.session_id = cs.id
    AND n.workspace_id IS NULL;
