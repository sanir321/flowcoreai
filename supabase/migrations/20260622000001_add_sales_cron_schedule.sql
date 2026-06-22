-- ==========================================
-- Schedule sales-cron edge function via pg_cron
-- ==========================================
-- Runs every 30 minutes to send pending sales follow-up messages
--
-- REQUIRED SETUP:
-- Before the cron job can authenticate, store your INTERNAL_CRON_SECRET:
--
--   Option A (recommended — Vault):
--     select vault.create_secret(
--       'your-internal-cron-secret-here',  -- ← your actual INTERNAL_CRON_SECRET
--       'cron_secret',
--       'INTERNAL_CRON_SECRET for sales-cron auth'
--     );
--
--   Option B (cron_config table):
--     insert into cron_config (key, value)
--     values ('internal_cron_secret', 'your-internal-cron-secret-here')
--     on conflict (key) do update
--       set value = excluded.value, updated_at = now();
--
-- ==========================================

-- Schedule sales-cron to check for pending follow-ups every 30 minutes
select cron.schedule(
  'sales-cron-every-30-min',
  '*/30 * * * *',
  $$
  select net.http_post(
    url:='https://bnpdrelienfnlkceluip.supabase.co/functions/v1/sales-cron',
    headers:=jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(
        (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret' limit 1),
        (select value from cron_config where key = 'internal_cron_secret' limit 1),
        ''
      )
    ),
    body:='{}'::jsonb
  ) as request_id;
  $$
);
