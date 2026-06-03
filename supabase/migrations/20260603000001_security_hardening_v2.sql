-- Fix 1: ai_performance_report → SECURITY INVOKER
DROP VIEW IF EXISTS public.ai_performance_report CASCADE;
CREATE VIEW public.ai_performance_report WITH (security_invoker=true) AS
 SELECT
    ats.workspace_id,
    count(ats.id) AS total_traces,
    (avg(ats.latency_ms))::integer AS avg_latency,
    count(*) FILTER (WHERE ats.guardrail_blocked) AS block_count,
    count(*) FILTER (WHERE ats.fallback_used) AS fallback_count,
    count(*) FILTER (WHERE ((NOT ats.escalation_triggered) AND (NOT ats.guardrail_blocked))) AS ai_resolutions,
        CASE
            WHEN (count(*) > 0) THEN round(((100.0 * (count(*) FILTER (WHERE ((NOT ats.escalation_triggered) AND (NOT ats.guardrail_blocked))))::numeric) / (count(*))::numeric), 1)
            ELSE (0)::numeric
        END AS ai_resolution_rate_pct
   FROM public.agent_traces ats
  WHERE (ats.workspace_id IN ( SELECT w.id
           FROM public.workspaces w
          WHERE (w.owner_id = (SELECT auth.uid()))))
  GROUP BY ats.workspace_id;

-- Fix 2: Restrict get_user_email to service_role only
REVOKE EXECUTE ON FUNCTION public.get_user_email(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_email(uuid) TO service_role;

-- Fix 3: Set search_path on match_kb_chunks overloads and get_distinct_kb_tags
ALTER FUNCTION public.get_distinct_kb_tags(uuid) SET search_path = 'public';
ALTER FUNCTION public.match_kb_chunks(vector, double precision, integer, uuid) SECURITY INVOKER SET search_path = 'public';
ALTER FUNCTION public.match_kb_chunks(vector, double precision, integer, uuid, text) SECURITY INVOKER SET search_path = 'public';

-- Fix 4: Drop 5 unused indexes
DROP INDEX IF EXISTS public.idx_menu_media_workspace;
DROP INDEX IF EXISTS public.idx_booking_sessions_workspace;
DROP INDEX IF EXISTS public.idx_booking_sessions_appointment;
DROP INDEX IF EXISTS public.idx_kb_sources_agent_id;
DROP INDEX IF EXISTS public.idx_ingestion_jobs_workspace_id;

-- Fix 5: Add missing indexes for unindexed foreign keys
CREATE INDEX IF NOT EXISTS idx_appointments_workspace_id ON public.appointments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_workspace_id ON public.follow_ups(workspace_id);
CREATE INDEX IF NOT EXISTS idx_kb_chunks_source_id ON public.kb_chunks(source_id);
CREATE INDEX IF NOT EXISTS idx_kb_sources_workspace_id ON public.kb_sources(workspace_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_contact_id ON public.support_tickets(contact_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_session_id ON public.support_tickets(session_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_workspace_id ON public.support_tickets(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON public.workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_booking_sessions_appointment_id ON public.booking_sessions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_workspace ON public.ingestion_jobs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_booking_sessions_workspace_id ON public.booking_sessions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_menu_media_workspace_id ON public.menu_media(workspace_id);
CREATE INDEX IF NOT EXISTS idx_kb_sources_agent_id_new ON public.kb_sources(agent_id);

-- Fix 6: Fix auth_rls_initplan on workspaces owner policy
DROP POLICY IF EXISTS "workspace_owner_access" ON public.workspaces;
CREATE POLICY "workspace_owner_access" ON public.workspaces
  FOR ALL
  USING ((owner_id = (SELECT auth.uid())) AND (deleted_at IS NULL));
