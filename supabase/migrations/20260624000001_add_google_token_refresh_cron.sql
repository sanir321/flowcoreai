-- ==========================================
-- Expose pg_try_advisory_lock / pg_advisory_unlock for edge functions
-- ==========================================
-- The google-token-refresh function uses these to prevent concurrent
-- token refreshes for the same workspace. The built-in PG functions
-- live in pg_catalog, so we expose them via public RPC wrappers.
-- ==========================================

create or replace function public.pg_try_advisory_lock(key bigint)
returns boolean
language sql strict security definer
as $$ select pg_catalog.pg_try_advisory_lock(key); $$;

create or replace function public.pg_advisory_unlock(key bigint)
returns boolean
language sql strict security definer
as $$ select pg_catalog.pg_advisory_unlock(key); $$;

-- ==========================================
-- Schedule google-token-refresh edge function via pg_cron
-- ==========================================
-- Runs every 30 minutes to proactively refresh Google OAuth tokens
-- before they expire, avoiding latency in customer-facing AI responses.
-- ==========================================

select cron.schedule(
  'google-token-refresh-every-30-min',
  '*/30 * * * *',
  $$
  select net.http_post(
    url:='https://bnpdrelienfnlkceluip.supabase.co/functions/v1/google-token-refresh',
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
