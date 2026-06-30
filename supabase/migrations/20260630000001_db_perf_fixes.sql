-- Migration: DB Performance & Security Fixes
-- 1. Drop duplicate index on conversation_sessions
-- 2. Add missing index on notification_reads.notification_id (unindexed FK)
-- 3. Fix Auth RLS InitPlan on notification_reads (3 policies)
-- 4. Drop redundant service_role policy on notifications (service_role bypasses RLS)
-- 5. Fix get_distinct_kb_tags mutable search_path

-- 1. Drop duplicate index
drop index if exists public.idx_unique_active_session;

-- 2. Add missing index on notification_reads FK
create index if not exists idx_notification_reads_notification_id
  on public.notification_reads using btree (notification_id);

-- 3. Fix Auth RLS InitPlan on notification_reads
drop policy if exists "Users can read own notification reads" on public.notification_reads;
create policy "Users can read own notification reads"
  on public.notification_reads for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own notification reads" on public.notification_reads;
create policy "Users can insert own notification reads"
  on public.notification_reads for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own notification reads" on public.notification_reads;
create policy "Users can delete own notification reads"
  on public.notification_reads for delete
  using ((select auth.uid()) = user_id);

-- 4. Drop redundant service_role policy on notifications (service_role bypasses RLS anyway)
drop policy if exists "Service role can manage notifications" on public.notifications;

-- 5. Fix get_distinct_kb_tags mutable search_path
create or replace function public.get_distinct_kb_tags(p_workspace_id uuid)
returns text[]
language plpgsql
search_path = 'public'
as $$
declare
    tags text[];
begin
    select array_agg(distinct t.tag)
    into tags
    from (
        select jsonb_array_elements_text(
            case
                when metadata is not null and metadata ? 'tag'
                then jsonb_build_array(metadata->>'tag')
                else '[]'::jsonb
            end
        ) as tag
        from public.kb_chunks
        where workspace_id = p_workspace_id
        and deleted_at is null
    ) t
    where t.tag is not null and t.tag != '';
    return coalesce(tags, '{}'::text[]);
end;
$$;
