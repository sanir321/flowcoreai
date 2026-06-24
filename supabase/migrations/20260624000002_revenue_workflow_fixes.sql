-- ==========================================
-- 1. Drop the 3-param decrement_credits overload
--    The 2-param version (with GREATEST(0,...) guard)
--    was added in 20260611000003. The 3-param had no
--    balance floor and allowed negative credits.
-- ==========================================
DROP FUNCTION IF EXISTS public.decrement_credits(uuid, integer, uuid);

-- ==========================================
-- 2. Unique partial index on active conversation sessions
--    Prevents race-condition orphan sessions for the same
--    customer + workspace + channel.
-- ==========================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversation_sessions_active_unique
  ON public.conversation_sessions(workspace_id, customer_jid, channel)
  WHERE status = 'active' AND deleted_at IS NULL;

-- ==========================================
-- 3. process_webhook_message RPC (captured for migration history)
--    Handles WhatsApp webhook dedup, contact upsert,
--    session management, and message insertion in a single
--    transaction with advisory locks.
-- ==========================================
CREATE OR REPLACE FUNCTION public.process_webhook_message(
  p_workspace_id uuid,
  p_customer_jid text,
  p_customer_name text,
  p_content text,
  p_gowa_message_id text DEFAULT NULL::text,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_media_path text DEFAULT NULL::text,
  p_media_mime text DEFAULT NULL::text,
  p_media_type text DEFAULT NULL::text,
  p_media_caption text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_contact_id uuid;
  v_session_id uuid;
  v_locked boolean;
  v_existing_id bigint;
  v_message_id uuid;
  v_phone text;
  v_has_media boolean;
  v_display_content text;
  v_media_metadata jsonb;
BEGIN
  SELECT pg_try_advisory_xact_lock(hashtext(p_customer_jid)) INTO v_locked;
  IF NOT v_locked THEN
    RETURN jsonb_build_object('status', 'duplicate', 'reason', 'concurrent_processing');
  END IF;

  v_phone := split_part(p_customer_jid, '@', 1);

  IF p_gowa_message_id IS NOT NULL AND p_gowa_message_id != '' THEN
    SELECT 1 INTO v_existing_id
    FROM public.messages
    WHERE gowa_message_id = p_gowa_message_id AND workspace_id = p_workspace_id
    LIMIT 1;
    IF FOUND THEN
      RETURN jsonb_build_object('status', 'duplicate', 'reason', 'existing_gowa_message_id');
    END IF;
  END IF;

  SELECT 1 INTO v_existing_id
  FROM public.messages
  WHERE workspace_id = p_workspace_id
    AND content = p_content
    AND direction = 'inbound'
    AND created_at > now() - interval '10 seconds'
  LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object('status', 'duplicate', 'reason', 'existing_content');
  END IF;

  INSERT INTO public.contacts (workspace_id, whatsapp_jid, name, phone, channel)
  VALUES (p_workspace_id, p_customer_jid, p_customer_name, v_phone, 'whatsapp')
  ON CONFLICT (workspace_id, phone) DO UPDATE
    SET name = p_customer_name, updated_at = now()
  RETURNING id INTO v_contact_id;

  SELECT id INTO v_session_id
  FROM public.conversation_sessions
  WHERE workspace_id = p_workspace_id
    AND customer_jid = p_customer_jid
    AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO public.conversation_sessions (workspace_id, contact_id, customer_jid, customer_name, channel, status)
    VALUES (p_workspace_id, v_contact_id, p_customer_jid, p_customer_name, 'whatsapp', 'active')
    RETURNING id INTO v_session_id;
  END IF;

  v_has_media := p_media_path IS NOT NULL AND p_media_path != '';
  v_display_content := CASE WHEN p_content != '' THEN p_content
                       WHEN v_has_media THEN '[Media message]'
                       ELSE '' END;

  v_media_metadata := p_metadata;
  IF v_has_media THEN
    v_media_metadata := v_media_metadata || jsonb_build_object(
      'media_path', p_media_path,
      'media_mime', p_media_mime,
      'media_type', COALESCE(p_media_type, p_media_mime)
    );
    IF p_media_caption IS NOT NULL AND p_media_caption != '' THEN
      v_media_metadata := v_media_metadata || jsonb_build_object('media_caption', p_media_caption);
    END IF;
  END IF;

  INSERT INTO public.messages (workspace_id, session_id, content, direction, role, gowa_message_id, metadata)
  VALUES (p_workspace_id, v_session_id, v_display_content, 'inbound', 'customer', p_gowa_message_id, v_media_metadata)
  RETURNING id INTO v_message_id;

  UPDATE public.conversation_sessions
  SET last_message_at = now(),
      last_customer_message_at = now(),
      last_message_preview = left(v_display_content, 100),
      updated_at = now()
  WHERE id = v_session_id;

  RETURN jsonb_build_object(
    'status', 'success',
    'session_id', v_session_id::text,
    'contact_id', v_contact_id::text,
    'message_id', v_message_id::text
  );

EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('status', 'duplicate', 'reason', 'unique_violation');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('status', 'error', 'reason', SQLERRM);
END;
$function$;
