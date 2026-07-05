-- Re-link active Gowa session to workspace (one-time data fix)
-- Wrapped in EXISTS check so it no-ops on fresh deploys (C7)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM workspaces WHERE id = 'b0dba5f3-bdba-4b04-96df-26fed007bbc5') THEN
    INSERT INTO gowa_sessions (workspace_id, gowa_session_id, phone_jid, status)
    VALUES ('b0dba5f3-bdba-4b04-96df-26fed007bbc5', '176675ff-3099-4c7c-8ee2-b66f956113c5', '918072432187@s.whatsapp.net', 'connected')
    ON CONFLICT (workspace_id) DO UPDATE 
    SET gowa_session_id = EXCLUDED.gowa_session_id, 
        phone_jid = EXCLUDED.phone_jid, 
        status = EXCLUDED.status,
        updated_at = NOW();

    UPDATE workspaces 
    SET gowa_instance_id = '176675ff-3099-4c7c-8ee2-b66f956113c5'
    WHERE id = 'b0dba5f3-bdba-4b04-96df-26fed007bbc5';
  END IF;
END $$;