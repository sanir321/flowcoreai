alter table public.workspaces add column if not exists low_credits_notified boolean not null default false;
