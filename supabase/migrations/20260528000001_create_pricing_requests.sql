create table if not exists public.pricing_requests (
  id         bigint primary key generated always as identity,
  created_at timestamptz not null default now(),
  first_name text not null,
  last_name  text not null,
  email      text not null
);

alter table public.pricing_requests enable row level security;

create policy if not exists "pricing_requests_insert_service_role"
  on public.pricing_requests for insert
  to service_role
  with check (true);

create policy if not exists "pricing_requests_select_service_role"
  on public.pricing_requests for select
  to service_role
  using (true);

-- Helper RPC: get user email from auth.users (used by edge functions)
create or replace function public.get_user_email(user_id uuid)
returns text
language sql
security definer
set search_path = auth
as $$
  select email from auth.users where id = user_id;
$$;
