-- Harden public advisory-lock RPC wrappers.
-- 20260630000002 revoked EXECUTE from anon/authenticated but PUBLIC still held
-- it, so anon/authenticated inherited access via PUBLIC and the
-- anon_security_definer_function_executable / authenticated_security_definer
-- warnings persisted. Only caller is the google-token-refresh edge function
-- running with service_role.
-- Also pin search_path='' on the SECURITY DEFINER wrappers (they reference only
-- pg_catalog functions, fully qualified) to clear function_search_path_mutable.

revoke execute on function public.pg_try_advisory_lock(bigint) from public;
revoke execute on function public.pg_advisory_unlock(bigint) from public;
revoke execute on function public.pg_try_advisory_lock(bigint) from anon, authenticated;
revoke execute on function public.pg_advisory_unlock(bigint) from anon, authenticated;

create or replace function public.pg_try_advisory_lock(key bigint)
returns boolean
language sql strict security definer
set search_path = ''
as $$ select pg_catalog.pg_try_advisory_lock(key); $$;

create or replace function public.pg_advisory_unlock(key bigint)
returns boolean
language sql strict security definer
set search_path = ''
as $$ select pg_catalog.pg_advisory_unlock(key); $$;

grant execute on function public.pg_try_advisory_lock(bigint) to service_role;
grant execute on function public.pg_advisory_unlock(bigint) to service_role;
