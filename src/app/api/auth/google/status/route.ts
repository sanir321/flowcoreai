import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const workspaceId = user.app_metadata.workspace_id
    if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 })

    const { data: googleTokens, error } = await (supabase
        .from("google_oauth_tokens") as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .select("google_email, token_expiry, scopes, calendar_id, sheet_id, sheet_range, created_at, updated_at")
        .eq("workspace_id", workspaceId)
        .is("deleted_at", null)
        .maybeSingle()
    
    if (error) return NextResponse.json({ error: "Failed to fetch Google status" }, { status: 500 })

    return NextResponse.json(googleTokens)
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error("[GOOGLE_STATUS_ERROR]", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}
