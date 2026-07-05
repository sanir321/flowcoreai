-- Allow anonymous (anon key) SELECT access to widget_config for embedded widget
-- Widget config contains public styling/display data (name, colors, greeting)
-- Security is enforced by application-level domain allowlist + rate limiting
CREATE POLICY "widget_config_public_select" ON widget_config
  FOR SELECT USING (true);

-- Allow anonymous (anon key) SELECT access to workspace_agents for agent name/avatar
-- Only agent name and config are exposed (public by design for embedded widget)
CREATE POLICY "workspace_agents_public_select" ON workspace_agents
  FOR SELECT USING (true);
