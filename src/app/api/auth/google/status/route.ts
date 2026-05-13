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
        .select("*")
        .eq("workspace_id", workspaceId)
        .maybeSingle()
    
    if (error) throw error

    return NextResponse.json(googleTokens)
  } catch (error: any) {
    console.error("[GOOGLE_STATUS_ERROR]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
