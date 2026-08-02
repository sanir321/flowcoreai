-- Public appointment confirmation page must NOT use service_role.
-- Expose only the fields the public page needs via a SECURITY DEFINER RPC
-- locked to search_path, and grant it to anon/authenticated.

create or replace function public.get_public_appointment(p_appointment_id uuid)
returns table (
  customer_name text,
  service text,
  start_at timestamptz,
  meeting_link text,
  workspace_name text,
  workspace_address text
)
language sql
security definer
set search_path = ''
stable
as $$
  select
    a.customer_name,
    a.service,
    a.start_at,
    a.meeting_link,
    w.name::text as workspace_name,
    ((w.business_profile->'contact'->>'address'))::text as workspace_address
  from public.appointments a
  join public.workspaces w on w.id = a.workspace_id
  where a.id = p_appointment_id
    and a.deleted_at is null
    and w.deleted_at is null
$$;

revoke all on function public.get_public_appointment(uuid) from public;
grant execute on function public.get_public_appointment(uuid) to anon, authenticated;
