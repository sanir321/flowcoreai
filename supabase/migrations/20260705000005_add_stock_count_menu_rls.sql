-- Add stock_count to menu_items for inventory tracking
alter table public.menu_items
  add column if not exists stock_count integer;

-- Widget RLS: anon users can read available menu items for their workspace
do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'menu_items' and policyname = 'menu_items_widget_select'
  ) then
    create policy "menu_items_widget_select"
      on public.menu_items
      for select
      to anon
      using (
        exists (
          select 1 from public.widget_config wc
          where wc.workspace_id = menu_items.workspace_id
        )
        and is_available = true
        and deleted_at is null
      );
  end if;
end
$$;
