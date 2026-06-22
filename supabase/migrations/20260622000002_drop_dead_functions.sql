-- Drop dead database functions (no callers, no triggers attached)
-- identified during dead-object audit 2026-06-22

drop function if exists public.fn_trigger_orchestrator();
drop function if exists public.get_workspace_health(p_workspace_id uuid);
