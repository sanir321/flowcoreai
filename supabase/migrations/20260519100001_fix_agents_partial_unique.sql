-- Replace unique constraint with partial index so soft-deleted records don't block re-insertion
ALTER TABLE workspace_agents DROP CONSTRAINT workspace_agents_workspace_id_agent_type_key;

CREATE UNIQUE INDEX workspace_agents_workspace_id_agent_type_key
  ON workspace_agents (workspace_id, agent_type)
  WHERE deleted_at IS NULL;
