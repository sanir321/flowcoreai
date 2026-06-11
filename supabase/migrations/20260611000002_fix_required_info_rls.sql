DROP POLICY IF EXISTS "Anyone can read templates" ON required_info_templates;
DROP POLICY IF EXISTS "Users can insert templates for their workspace" ON required_info_templates;
DROP POLICY IF EXISTS "Users can update templates for their workspace" ON required_info_templates;
DROP POLICY IF EXISTS "Users can delete templates for their workspace" ON required_info_templates;
DROP POLICY IF EXISTS "Authenticated users can read templates" ON required_info_templates;
DROP POLICY IF EXISTS "Authenticated users can insert templates" ON required_info_templates;
DROP POLICY IF EXISTS "Authenticated users can update templates" ON required_info_templates;
DROP POLICY IF EXISTS "Authenticated users can delete templates" ON required_info_templates;

ALTER TABLE required_info_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read templates"
  ON required_info_templates
  FOR SELECT
  USING (true);
