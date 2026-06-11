ALTER POLICY IF EXISTS "Anyone can read templates" ON required_info_templates DISABLE ROW LEVEL SECURITY;
ALTER POLICY IF EXISTS "Users can insert templates for their workspace" ON required_info_templates DISABLE ROW LEVEL SECURITY;
ALTER POLICY IF EXISTS "Users can update templates for their workspace" ON required_info_templates DISABLE ROW LEVEL SECURITY;
ALTER POLICY IF EXISTS "Users can delete templates for their workspace" ON required_info_templates DISABLE ROW LEVEL SECURITY;
ALTER POLICY IF EXISTS "Authenticated users can read templates" ON required_info_templates DISABLE ROW LEVEL SECURITY;
ALTER POLICY IF EXISTS "Authenticated users can insert templates" ON required_info_templates DISABLE ROW LEVEL SECURITY;
ALTER POLICY IF EXISTS "Authenticated users can update templates" ON required_info_templates DISABLE ROW LEVEL SECURITY;
ALTER POLICY IF EXISTS "Authenticated users can delete templates" ON required_info_templates DISABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'required_info_templates') THEN
    DROP POLICY IF EXISTS "Anyone can read templates" ON required_info_templates;
    DROP POLICY IF EXISTS "Users can insert templates for their workspace" ON required_info_templates;
    DROP POLICY IF EXISTS "Users can update templates for their workspace" ON required_info_templates;
    DROP POLICY IF EXISTS "Users can delete templates for their workspace" ON required_info_templates;
    DROP POLICY IF EXISTS "Authenticated users can read templates" ON required_info_templates;
    DROP POLICY IF EXISTS "Authenticated users can insert templates" ON required_info_templates;
    DROP POLICY IF EXISTS "Authenticated users can update templates" ON required_info_templates;
    DROP POLICY IF EXISTS "Authenticated users can delete templates" ON required_info_templates;
  END IF;
END $$;

ALTER TABLE required_info_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read templates"
  ON required_info_templates
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert templates for their workspace"
  ON required_info_templates
  FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update templates for their workspace"
  ON required_info_templates
  FOR UPDATE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete templates for their workspace"
  ON required_info_templates
  FOR DELETE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));
