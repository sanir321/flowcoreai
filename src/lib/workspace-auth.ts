import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Verify that a user owns a workspace via DB lookup.
 * Returns the workspace ID if authorized, or an error string if not.
 *
 * IMPORTANT: Do NOT rely on user.app_metadata.workspace_id for authorization.
 * The JWT's app_metadata can be stale if the user created a workspace after
 * their token was issued. Always verify via this DB lookup instead.
 */
export async function verifyWorkspaceOwnership(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string
): Promise<{ authorized: true; workspaceId: string } | { authorized: false; error: string }> {
  const { data, error } = await supabase
    .from("workspaces")
    .select("id")
    .eq("id", workspaceId)
    .eq("owner_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) {
    return { authorized: false, error: "Workspace not found or unauthorized" };
  }

  return { authorized: true, workspaceId: data.id };
}

/**
 * Get the workspace ID for a user via DB lookup.
 * Returns the workspace ID if found, or null if the user has no workspace.
 *
 * IMPORTANT: Do NOT rely on user.app_metadata.workspace_id.
 * Always use this DB lookup to get the canonical workspace ID.
 */
export async function getUserWorkspaceId(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data?.id ?? null;
}
