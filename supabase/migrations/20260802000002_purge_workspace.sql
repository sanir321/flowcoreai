-- Account deletion must hard-delete data (soft-deleting rows while the auth user
-- is removed leaves orphaned data forever). This SECURITY DEFINER function
-- hard-deletes every workspace-scoped row in FK-safe order inside one transaction.
-- service_role-only: no grants to anon/authenticated.

create or replace function public.purge_workspace(p_workspace_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- deepest children first (FK-safe order)

  -- references workspace_agents / agent_skills
  delete from public.agent_skill_assignments
  where agent_id in (select id from public.workspace_agents where workspace_id = p_workspace_id);

  -- references kb_sources
  delete from public.kb_chunks where workspace_id = p_workspace_id;

  -- references conversation_sessions
  delete from public.messages where workspace_id = p_workspace_id;
  delete from public.tool_call_logs where workspace_id = p_workspace_id;
  delete from public.failed_messages where workspace_id = p_workspace_id;
  delete from public.agent_traces where workspace_id = p_workspace_id;

  -- references appointments / conversation_sessions
  delete from public.booking_sessions where workspace_id = p_workspace_id;

  -- references contacts / conversation_sessions
  delete from public.appointments where workspace_id = p_workspace_id;
  delete from public.follow_ups where workspace_id = p_workspace_id;
  delete from public.quotes where workspace_id = p_workspace_id;
  delete from public.orders where workspace_id = p_workspace_id;
  delete from public.support_tickets where workspace_id = p_workspace_id;
  delete from public.escalation_logs where workspace_id = p_workspace_id;

  -- notification_reads references notifications (join via workspace)
  delete from public.notification_reads
  where notification_id in (select id from public.notifications where workspace_id = p_workspace_id);
  delete from public.notifications where workspace_id = p_workspace_id;

  -- references workspaces (or workspace-scoped single-row tables)
  delete from public.conversation_sessions where workspace_id = p_workspace_id;
  delete from public.workspace_agents where workspace_id = p_workspace_id;
  delete from public.kb_sources where workspace_id = p_workspace_id;
  delete from public.kb_response_cache where workspace_id = p_workspace_id;
  delete from public.ingestion_jobs where workspace_id = p_workspace_id;
  delete from public.contacts where workspace_id = p_workspace_id;
  delete from public.workspace_notifications where workspace_id = p_workspace_id;
  delete from public.widget_config where workspace_id = p_workspace_id;
  delete from public.gowa_sessions where workspace_id = p_workspace_id;
  delete from public.google_oauth_tokens where workspace_id = p_workspace_id;
  delete from public.billing_transactions where workspace_id = p_workspace_id;
  delete from public.agent_skills where workspace_id = p_workspace_id;
  delete from public.rate_limits where workspace_id = p_workspace_id;
  delete from public.audit_logs where workspace_id = p_workspace_id;
  delete from public.callback_queue where workspace_id = p_workspace_id;
  delete from public.menu_items where workspace_id = p_workspace_id;
  delete from public.menu_media where workspace_id = p_workspace_id;
  delete from public.business_templates where workspace_id = p_workspace_id;

  delete from public.workspaces where id = p_workspace_id;
end;
$$;

revoke all on function public.purge_workspace(uuid) from public;
revoke all on function public.purge_workspace(uuid) from anon, authenticated;
grant execute on function public.purge_workspace(uuid) to service_role;
