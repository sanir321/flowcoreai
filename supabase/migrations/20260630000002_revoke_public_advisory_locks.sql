-- Revoke public access to advisory lock functions (exposed via API, not user-facing)
revoke execute on function pg_advisory_unlock(bigint) from anon, authenticated;
revoke execute on function pg_try_advisory_lock(bigint) from anon, authenticated;
