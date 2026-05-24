-- Security Hardening — Remaining Fixes
-- Applies only the fixes still missing from the database

-- ============================================================================
-- 1. Fix storage policies: add missing deleted_at checks + InitPlan pattern
-- ============================================================================

-- menu_media_owner_write: add deleted_at is null on workspaces subquery
drop policy if exists "menu_media_owner_write" on storage.objects;
create policy "menu_media_owner_write" on storage.objects for insert
  with check (
    bucket_id = 'menu-media'
    and (storage.foldername(name))[1] in (
      select w.id::text from public.workspaces w 
      where w.owner_id = (select auth.uid()) 
      and w.deleted_at is null
    )
  );

-- menu_media_owner_delete: add deleted_at is null on workspaces subquery
drop policy if exists "menu_media_owner_delete" on storage.objects;
create policy "menu_media_owner_delete" on storage.objects for delete
  using (
    bucket_id = 'menu-media'
    and (storage.foldername(name))[1] in (
      select w.id::text from public.workspaces w 
      where w.owner_id = (select auth.uid())
      and w.deleted_at is null
    )
  );

-- kb_docs_tenant: fix InitPlan pattern (bare auth.uid() -> (select auth.uid()))
drop policy if exists "kb_docs_tenant" on storage.objects;
create policy "kb_docs_tenant" on storage.objects for all
  using (bucket_id = 'kb-documents'
    and exists (
      select 1 from workspaces w
      where w.id::text = (storage.foldername(name))[1]
      and w.owner_id = (select auth.uid())
      and w.deleted_at is null
    ));
