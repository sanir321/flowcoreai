-- Fix notifications: add workspace_id for tenant isolation
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_notifications_workspace_id ON notifications(workspace_id);
