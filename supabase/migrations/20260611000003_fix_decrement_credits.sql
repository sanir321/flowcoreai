CREATE OR REPLACE FUNCTION decrement_credits(p_workspace_id uuid, p_credits integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE workspaces
  SET credits_balance = GREATEST(0, credits_balance - p_credits)
  WHERE id = p_workspace_id
    AND credits_balance >= p_credits;
END;
$$;
