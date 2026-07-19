import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"
import { getUserWorkspaceId } from "@/lib/workspace-auth"

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { success: isAllowed } = await rateLimit(ip);
    if (!isAllowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Get workspace ID via DB lookup (not stale JWT app_metadata)
    const workspaceId = await getUserWorkspaceId(supabase, user.id)
    if (!workspaceId) return NextResponse.json({ error: "No workspace found" }, { status: 404 })

    const { data: contacts, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })

    if (error) throw error

    const headers = ["Name", "Email", "Phone", "Channel", "Tags", "Last Contacted", "Created At"]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (contacts || []).map((c: Record<string, any>) => [
      escapeCsv(c.name ?? ""),
      escapeCsv(c.email ?? ""),
      escapeCsv(c.phone ?? ""),
      escapeCsv(c.channel ?? ""),
      escapeCsv(Array.isArray(c.tags) ? c.tags.join("; ") : (c.tags ?? "")),
      escapeCsv(c.last_contacted_at ?? ""),
      escapeCsv(c.created_at ?? ""),
    ])

    const csv = [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join("\r\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="contacts-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error("[EXPORT_CONTACTS] Error:", err.message)
    return NextResponse.json({ error: "Failed to export contacts" }, { status: 500 })
  }
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
