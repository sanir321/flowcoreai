-- C2: SECURITY DEFINER functions for widget API
-- Enables widget route to use anon key (principle of least privilege)
-- instead of service_role for database operations.

-- Drop existing if re-applying
drop function if exists public.handle_widget_message(uuid, text, text, text, text);
drop function if exists public.get_widget_messages(uuid, text, timestamptz);
drop function if exists public.get_widget_config(uuid);

-- ============================================================
-- handle_widget_message: all DB writes for widget POST endpoint
-- ============================================================
create or replace function public.handle_widget_message(
  p_workspace_id uuid,
  p_session_token text,
  p_message text,
  p_customer_name text default null,
  p_customer_email text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workspace record;
  v_widget_config record;
  v_session record;
  v_contact_id uuid;
begin
  -- 1. Validate workspace
  select id, is_ai_enabled into v_workspace
  from workspaces
  where id = p_workspace_id and deleted_at is null;

  if v_workspace.id is null then
    return jsonb_build_object('error', 'Workspace not found');
  end if;
  if v_workspace.is_ai_enabled = false then
    return jsonb_build_object('error', 'AI responses are disabled');
  end if;

  -- 2. Validate widget config
  select workspace_id, is_active, allowed_domains into v_widget_config
  from widget_config
  where workspace_id = p_workspace_id and deleted_at is null;

  if v_widget_config.workspace_id is null then
    return jsonb_build_object('error', 'Widget not configured');
  end if;
  if v_widget_config.is_active = false then
    return jsonb_build_object('error', 'Widget is disabled');
  end if;
  if v_widget_config.allowed_domains is null or array_length(v_widget_config.allowed_domains, 1) = 0 then
    return jsonb_build_object('error', 'No allowed domains configured');
  end if;

  -- 3. Find existing session
  select * into v_session
  from conversation_sessions
  where workspace_id = p_workspace_id
    and customer_jid = p_session_token
    and channel = 'widget'
    and status = 'active'
    and deleted_at is null
  order by created_at desc
  limit 1;

  -- 4. If no session, upsert contact + create session
  if v_session.id is null then
    -- Upsert contact (PG-version-agnostic: select first, insert with race retry)
    select id into v_contact_id
    from contacts
    where workspace_id = p_workspace_id
      and session_token = p_session_token
      and deleted_at is null;

    if v_contact_id is null then
      begin
        insert into contacts (workspace_id, session_token, channel, name, email)
        values (p_workspace_id, p_session_token, 'widget', coalesce(p_customer_name, 'Widget User'), p_customer_email)
        returning id into v_contact_id;
      exception when unique_violation then
        select id into v_contact_id
        from contacts
        where workspace_id = p_workspace_id
          and session_token = p_session_token
          and deleted_at is null;
      end;
    end if;

    -- Create session
    insert into conversation_sessions (
      workspace_id, contact_id, customer_jid, customer_name, channel, agent_type, status
    ) values (
      p_workspace_id, v_contact_id, p_session_token,
      coalesce(p_customer_name, 'Widget User'),
      'widget', 'customer_support', 'active'
    )
    returning * into v_session;

    -- Insert message
    insert into messages (workspace_id, session_id, content, direction, role)
    values (p_workspace_id, v_session.id, p_message, 'inbound', 'customer');

    -- Update session metadata
    update conversation_sessions set
      last_message_at = now(),
      last_message_preview = left(p_message, 100),
      message_count = coalesce(message_count, 0) + 1
    where id = v_session.id;

    return jsonb_build_object(
      'session_id', v_session.id,
      'contact_id', v_contact_id,
      'customer_name', coalesce(p_customer_name, 'Widget User'),
      'new_session', true
    );
  end if;

  -- 5. Existing session — update name if improved
  if p_customer_name is not null and v_session.customer_name = 'Widget User' then
    update conversation_sessions
    set customer_name = p_customer_name, updated_at = now()
    where id = v_session.id;

    if v_session.contact_id is not null then
      update contacts
      set name = p_customer_name,
          email = coalesce(p_customer_email, email),
          updated_at = now()
      where id = v_session.contact_id;
    end if;
  end if;

  -- Insert message
  insert into messages (workspace_id, session_id, content, direction, role)
  values (p_workspace_id, v_session.id, p_message, 'inbound', 'customer');

  -- Update session metadata
  update conversation_sessions set
    last_message_at = now(),
    last_message_preview = left(p_message, 100),
    message_count = coalesce(message_count, 0) + 1
  where id = v_session.id;

  return jsonb_build_object(
    'session_id', v_session.id,
    'contact_id', v_session.contact_id,
    'customer_name', coalesce(p_customer_name, v_session.customer_name),
    'new_session', false
  );
end;
$$;

-- ============================================================
-- get_widget_messages: read messages for widget GET endpoint
-- (optional migration companion, applied if route switches to anon)
-- ============================================================
create or replace function public.get_widget_messages(
  p_workspace_id uuid,
  p_session_token text,
  p_since timestamptz default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session_id uuid;
  v_messages jsonb;
begin
  select id into v_session_id
  from conversation_sessions
  where workspace_id = p_workspace_id
    and customer_jid = p_session_token
    and channel = 'widget'
    and deleted_at is null
  order by created_at desc
  limit 1;

  if v_session_id is null then
    return jsonb_build_array();
  end if;

  select jsonb_agg(
    jsonb_build_object(
      'content', content,
      'direction', direction,
      'role', role,
      'created_at', created_at
    ) order by created_at asc
  ) into v_messages
  from messages
  where workspace_id = p_workspace_id
    and session_id = v_session_id
    and role <> 'system'
    and (p_since is null or created_at > p_since);

  return coalesce(v_messages, jsonb_build_array());
end;
$$;

-- ============================================================
-- get_widget_config: lightweight check for route-level domain validation
-- Returns workspace + config so route can enforce Origin allowlist
-- before calling handle_widget_message.
-- ============================================================
create or replace function public.get_widget_config(
  p_workspace_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workspace record;
  v_config record;
begin
  select id, is_ai_enabled into v_workspace
  from workspaces
  where id = p_workspace_id and deleted_at is null;

  if v_workspace.id is null then
    return jsonb_build_object('error', 'Workspace not found');
  end if;

  select workspace_id, is_active, allowed_domains into v_config
  from widget_config
  where workspace_id = p_workspace_id and deleted_at is null;

  if v_config.workspace_id is null or v_config.is_active = false then
    return jsonb_build_object('error', 'Widget not configured');
  end if;

  if v_config.allowed_domains is null or array_length(v_config.allowed_domains, 1) = 0 then
    return jsonb_build_object('error', 'No allowed domains configured');
  end if;

  return jsonb_build_object(
    'workspace_id', v_workspace.id,
    'ai_enabled', v_workspace.is_ai_enabled,
    'allowed_domains', to_jsonb(v_config.allowed_domains)
  );
end;
$$;

-- Grant execute to anon role
grant execute on function public.handle_widget_message(uuid, text, text, text, text) to anon;
grant execute on function public.get_widget_messages(uuid, text, timestamptz) to anon;
grant execute on function public.get_widget_config(uuid) to anon;
