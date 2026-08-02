import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"
import { getUserWorkspaceId } from "@/lib/workspace-auth"

/* eslint-disable @typescript-eslint/no-explicit-any */

const GOWA_BASE_URL = process.env.GOWA_BASE_URL?.replace(/\/$/, "") || ""
const GOWA_API_KEY = process.env.GOWA_API_KEY || ""
const GOWA_AUTH = GOWA_API_KEY ? Buffer.from(GOWA_API_KEY).toString("base64") : ""

async function deleteGoWADevice(deviceId: string): Promise<string | null> {
  const logoutErr = await fetch(`${GOWA_BASE_URL}/devices/${deviceId}/logout`, {
    method: "POST", headers: { "Authorization": `Basic ${GOWA_AUTH}` },
  }).then(r => r.ok ? null : `logout ${r.status}`).catch(e => `logout: ${e}`)
  const deleteErr = await fetch(`${GOWA_BASE_URL}/devices/${deviceId}`, {
    method: "DELETE", headers: { "Authorization": `Basic ${GOWA_AUTH}` },
  }).then(r => r.ok ? null : `delete ${r.status}`).catch(e => `delete: ${e}`)
  const errs = [logoutErr, deleteErr].filter(Boolean)
  return errs.length ? errs.join(", ") : null
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { success: isAllowed } = await rateLimit(ip);
    if (!isAllowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Require re-authentication: check for confirmation_token in body
    const body = await req.json().catch(() => ({}));
    const confirmationToken = body?.confirmation_token;
    
    if (!confirmationToken) {
      // Step 1: Send confirmation OTP
      const { error } = await supabase.auth.signInWithOtp({
        email: user.email!,
        options: { shouldCreateUser: false },
      });
      if (error) {
        return NextResponse.json({ error: "Failed to send confirmation code" }, { status: 500 });
      }
      return NextResponse.json({ requires_confirmation: true, message: "Confirmation code sent to your email" });
    }

    // Step 2: Verify the confirmation OTP
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: user.email!,
      token: confirmationToken,
      type: 'email',
    });
    if (verifyError) {
      return NextResponse.json({ error: "Invalid or expired confirmation code" }, { status: 401 });
    }

    // Get workspace ID via DB lookup (not stale JWT app_metadata)
    const workspaceId = await getUserWorkspaceId(supabase, user.id)

    // Verify workspace exists (stale JWT guard)
    if (workspaceId) {
      const { data: workspace } = await supabase
        .from("workspaces").select("id").eq("id", workspaceId).is("deleted_at", null).maybeSingle()
      if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    if (workspaceId) {
      // Get GoWA device IDs before purging rows
      const { data: gowaDevices } = await supabase
        .from("gowa_sessions").select("gowa_session_id")
        .eq("workspace_id", workspaceId)
        .is("deleted_at", null)

      // Hard-delete all workspace data in one transaction (service_role-only RPC)
      const admin = createAdminClient();
      const { error: purgeError } = await admin.rpc("purge_workspace", { p_workspace_id: workspaceId });
      if (purgeError) {
        console.error("[DELETE_ACCOUNT] purge_workspace failed, aborting:", purgeError.message);
        return NextResponse.json({ error: "Failed to delete workspace data" }, { status: 500 });
      }

      // Logout + delete GoWA device from Railway (best-effort)
      for (const d of gowaDevices || []) {
        const err = await deleteGoWADevice(d.gowa_session_id)
        if (err) console.error(`[DELETE_ACCOUNT] GoWA cleanup failed for ${d.gowa_session_id}:`, err)
      }
    }

    // Delete auth user (service_role)
    const admin = createAdminClient()
    const { error: authErr } = await admin.auth.admin.deleteUser(user.id)
    if (authErr) {
      console.error("[DELETE_ACCOUNT] Auth user deletion failed:", authErr.message)
      return NextResponse.json({ error: "Failed to delete auth user" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("[DELETE_ACCOUNT] Error:", err.message)
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }
}
