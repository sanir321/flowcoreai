-- Booking FSM fixes: service synonyms, business templates, and monitoring

-- 1. Add service synonyms to workspaces for fuzzy matching
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS service_synonyms JSONB DEFAULT '{}';

-- 2. Create business_templates table for configurable booking prompts
CREATE TABLE IF NOT EXISTS business_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  template_key TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (workspace_id, template_key)
);

-- 3. Add monitoring columns to agent_traces
ALTER TABLE agent_traces ADD COLUMN IF NOT EXISTS fsm_state TEXT;
ALTER TABLE agent_traces ADD COLUMN IF NOT EXISTS extraction_confidence FLOAT;
ALTER TABLE agent_traces ADD COLUMN IF NOT EXISTS validation_errors JSONB;
