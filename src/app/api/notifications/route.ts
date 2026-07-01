import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const workspaceId = user.app_metadata?.workspace_id
    if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 })

    const admin = createAdminClient()

    const { data: notifications, error } = await (admin as any)
      .from("notifications")
      .select(`
        *,
        notification_reads!left(user_id)
      `)
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) throw error

    const mapped: Array<{ id: string; title: string; message: string; type: string; link: string | null; created_at: string; is_read: boolean }> = (notifications || []).map((n: any) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      link: n.link,
      created_at: n.created_at,
      is_read: n.notification_reads?.some((r: any) => r.user_id === user.id) ?? false,
    }))

    const unread_count = mapped.filter((n) => !n.is_read).length

    return NextResponse.json({ notifications: mapped, unread_count })
  } catch (e: unknown) {
    console.error("Notifications GET error:", e)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { notification_id } = await req.json()
    if (!notification_id) {
      return NextResponse.json({ error: "notification_id is required" }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await (admin as any)
      .from("notification_reads")
      .insert({ user_id: user.id, notification_id })
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ success: true, already_read: true })
      }
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    console.error("Notifications POST error:", e)
    return NextResponse.json({ error: "Failed to mark notification as read" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const notification_id = searchParams.get("notification_id")

    if (!notification_id) {
      return NextResponse.json({ error: "notification_id is required" }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await (admin as any)
      .from("notification_reads")
      .delete()
      .eq("user_id", user.id)
      .eq("notification_id", notification_id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    console.error("Notifications DELETE error:", e)
    return NextResponse.json({ error: "Failed to mark notification as unread" }, { status: 500 })
  }
}
