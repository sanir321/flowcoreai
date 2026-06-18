-- Security & Performance Hardening V3
-- Fixes all Supabase advisor issues:
--   SECURITY: anon_security_definer, cron_config RLS, function search_path
--   PERFORMANCE: auth_rls_initplan, duplicate policies, unindexed FKs

-- ==========================================
-- 1. cron_config RLS — was always-true
-- ==========================================
drop policy if exists "cron_config_admin" on cron_config;
create policy "cron_config_service_role" on cron_config
  for all using ((select auth.role()) = 'service_role');

-- ==========================================
-- 2. Set search_path on ALL functions
-- ==========================================
alter function public.check_login_lockout(text, text, integer, integer, integer) security definer set search_path = '';
alter function public.cleanup_gowa_device() set search_path = '';
alter function public.cleanup_old_login_attempts() security definer set search_path = '';
alter function public.decrement_credits(uuid, integer) security definer set search_path = '';
alter function public.decrement_credits(uuid, integer, uuid) set search_path = '';
alter function public.get_distinct_kb_tags(uuid) security definer set search_path = '';
alter function public.get_user_email(uuid) set search_path = '';
alter function public.get_workspace_health(uuid) set search_path = '';
alter function public.lock_booking_session(uuid) set search_path = '';
alter function public.process_pending_follow_ups() security definer set search_path = '';
alter function public.process_webhook_message(uuid, text, text, text, text, jsonb, text, text, text, text) set search_path = '';
alter function public.purge_old_audit_logs() security definer set search_path = '';
alter function public.purge_old_debug_logs() security definer set search_path = '';
alter function public.record_login_attempt(text, text, boolean) security definer set search_path = '';
alter function public.set_updated_at() set search_path = '';
alter function public.auth_role_safe() set search_path = '';
alter function public.auth_uid_safe() set search_path = '';
alter function public.sanitize_allowed_domain(text) set search_path = '';
alter function public.match_kb_chunks(vector, double precision, integer, uuid, text) set search_path = '';

-- ==========================================
-- 3. Revoke SECURITY DEFINER functions from anon/authenticated
-- ==========================================
revoke execute on function public.check_login_lockout(p_email text, p_ip text, p_max_attempts integer, p_window_minutes integer, p_lockout_minutes integer) from public;
revoke execute on function public.cleanup_old_login_attempts() from public;
revoke execute on function public.decrement_credits(p_workspace_id uuid, p_credits integer) from public;
revoke execute on function public.process_pending_follow_ups() from public;
revoke execute on function public.purge_old_audit_logs() from public;
revoke execute on function public.purge_old_debug_logs() from public;
revoke execute on function public.record_login_attempt(p_email text, p_ip text, p_success boolean) from public;

-- get_distinct_kb_tags needs to stay accessible to authenticated dashboard users, but not to anon
revoke execute on function public.get_distinct_kb_tags(p_workspace_id uuid) from public;
grant execute on function public.get_distinct_kb_tags(p_workspace_id uuid) to authenticated;

-- ==========================================
-- 4. Fix auth_rls_initPlan on all policies
-- ==========================================

-- debug_logs
drop policy if exists "Enable all for service role" on debug_logs;
create policy "Enable all for service role" on debug_logs
  for all using ((select auth.role()) = 'service_role');

-- login_attempts
drop policy if exists "Service role only" on login_attempts;
create policy "Service role only" on login_attempts
  for all using ((select auth.role()) = 'service_role');

-- security_audit_log
drop policy if exists "Service role only" on security_audit_log;
create policy "Service role only" on security_audit_log
  for all using ((select auth.role()) = 'service_role');

-- callback_queue
drop policy if exists "callback_queue_service_role_only" on callback_queue;
create policy "callback_queue_service_role_only" on callback_queue
  for all using ((select auth.role()) = 'service_role');

-- rate_limits
drop policy if exists "rate_limits_service_role_only" on rate_limits;
create policy "rate_limits_service_role_only" on rate_limits
  for all using ((select auth.role()) = 'service_role');

-- waitlist
drop policy if exists "waitlist_admin_only" on waitlist;
drop policy if exists "waitlist_admin_select" on waitlist;
create policy "waitlist_admin_select" on waitlist
  for select using ((select auth.role()) = 'service_role');
create policy "waitlist_admin_update" on waitlist
  for update using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');
create policy "waitlist_admin_delete" on waitlist
  for delete using ((select auth.role()) = 'service_role');

-- audit_logs — merge into single SELECT policy to avoid duplicate
drop policy if exists "audit_logs_service_role_select" on audit_logs;
drop policy if exists "audit_logs_service_role_modify" on audit_logs;
drop policy if exists "audit_logs_service_role_update" on audit_logs;
drop policy if exists "audit_logs_service_role_delete" on audit_logs;
drop policy if exists "audit_logs_workspace_read" on audit_logs;
drop policy if exists "Service role full access" on audit_logs;
drop policy if exists "Workspace members read own" on audit_logs;

create policy "audit_logs_select" on audit_logs
  for select using (
    (select auth.role()) = 'service_role'
    or workspace_id in (select id from workspaces where owner_id = (select auth.uid()) and deleted_at is null)
  );
create policy "audit_logs_service_role_modify" on audit_logs
  for insert with check ((select auth.role()) = 'service_role');
create policy "audit_logs_service_role_update" on audit_logs
  for update using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');
create policy "audit_logs_service_role_delete" on audit_logs
  for delete using ((select auth.role()) = 'service_role');

-- ==========================================
-- 5. Fix duplicate permissive policies
-- ==========================================

-- menu_media: merge duplicates into one
drop policy if exists "menu_media_rls" on menu_media;
drop policy if exists "Users can view their workspace menu media" on menu_media;
create policy "menu_media_tenant_isolation" on menu_media
  for select using (workspace_id in (
    select id from workspaces where owner_id = (select auth.uid()) and deleted_at is null
  ));

-- required_info_templates: merge duplicates
drop policy if exists "Anyone can read templates" on required_info_templates;
drop policy if exists "authenticated_read_templates" on required_info_templates;
create policy "templates_authenticated_read" on required_info_templates
  for select using (true);

-- ==========================================
-- 6. Covering indexes for unindexed FKs
-- ==========================================
create index if not exists idx_appointments_workspace ON appointments(workspace_id);
create index if not exists idx_booking_sessions_appointment ON booking_sessions(appointment_id);
create index if not exists idx_booking_sessions_workspace ON booking_sessions(workspace_id);
create index if not exists idx_callback_queue_workspace ON callback_queue(workspace_id);
create index if not exists idx_contacts_merged_into ON contacts(merged_into);
create index if not exists idx_kb_sources_agent ON kb_sources(agent_id);
create index if not exists idx_kb_sources_workspace ON kb_sources(workspace_id);

-- ==========================================
-- 7. Drop stale unused indexes
-- ==========================================
drop index if exists idx_kb_sources_workspace_id;
drop index if exists idx_kb_sources_agent_id_new;
drop index if exists idx_callback_queue_status_scheduled;
drop index if exists idx_appointments_workspace_id;
drop index if exists idx_booking_sessions_appointment_id;
drop index if exists idx_booking_sessions_workspace_id;
drop index if exists idx_login_attempts_email_time;
drop index if exists idx_login_attempts_ip_time;
drop index if exists idx_security_audit_workspace;
drop index if exists idx_security_audit_event;
drop index if exists idx_audit_logs_actor;
drop index if exists idx_audit_logs_entity;
