CREATE INDEX IF NOT EXISTS idx_orders_contact_id ON orders(contact_id);
CREATE INDEX IF NOT EXISTS idx_orders_session_id ON orders(session_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_contact_id ON follow_ups(contact_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_session_id ON follow_ups(session_id);
CREATE INDEX IF NOT EXISTS idx_failed_messages_session_id ON failed_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_traces_session_id ON agent_traces(session_id);
CREATE INDEX IF NOT EXISTS idx_billing_transactions_workspace_id ON billing_transactions(workspace_id);
