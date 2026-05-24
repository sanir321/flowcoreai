import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new NextResponse("Unauthorized", { status: 401 })

    const workspaceId = user.app_metadata.workspace_id
    if (!workspaceId) return new NextResponse("No workspace", { status: 400 })

    const { data: googleTokens, error } = await (supabase
        .from("google_oauth_tokens") as any)
        .select("google_email, token_expiry, scopes, calendar_id, sheet_id, sheet_range, sync_status, created_at, updated_at")
        .eq("workspace_id", workspaceId)
        .is("deleted_at", null)
        .maybeSingle()
    
    if (error) throw error

    // Only expose safe fields — never return access_token, refresh_token to the client
    return NextResponse.json(googleTokens)
  } catch (error: any) {
    console.error("[GOOGLE_STATUS_ERROR]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
