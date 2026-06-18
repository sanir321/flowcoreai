-- Add logo_url and launcher_icon columns to widget_config
alter table widget_config
  add column if not exists logo_url text,
  add column if not exists launcher_icon text not null default 'chat',
  add column if not exists header_text text not null default 'FlowCore',
  add column if not exists agent_name text not null default 'Assistant',
  add column if not exists post_form_message text not null default 'Thank you! How can I help you today?',
  add column if not exists allow_anonymous boolean not null default false,
  add column if not exists auto_fill_params boolean not null default false,
  add column if not exists email_notifications boolean not null default false,
  add column if not exists whatsapp_number text;

-- Storage bucket for widget logos (public for CDN access)
insert into storage.buckets (id, name, public) values
  ('widget-logos', 'widget-logos', true)
on conflict (id) do nothing;

-- Policy: anyone can read widget logos (they're on the public widget)
create policy "widget_logos_public_read" on storage.objects for select
  using (bucket_id = 'widget-logos');

-- Policy: workspace owners can upload their own logo
create policy "widget_logos_tenant_write" on storage.objects for insert
  with check (
    bucket_id = 'widget-logos'
    and (storage.foldername(name))[1] in (
      select w.id::text from workspaces w where w.owner_id = auth.uid() and w.deleted_at is null
    )
  );

-- Policy: workspace owners can update/delete their own logo
create policy "widget_logos_tenant_all" on storage.objects for all
  using (
    bucket_id = 'widget-logos'
    and (storage.foldername(name))[1] in (
      select w.id::text from workspaces w where w.owner_id = auth.uid() and w.deleted_at is null
    )
  );
