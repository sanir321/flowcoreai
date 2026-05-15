import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const auth = await createServerClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: tokens } = await supabase
      .from("google_oauth_tokens")
      .select("access_token, sheet_id, sheet_range, token_expiry, refresh_token")
      .limit(1)
      .single()

    if (!tokens?.sheet_id || !tokens?.access_token) {
      return NextResponse.json({ error: "No Google Sheet configured" }, { status: 404 })
    }

    let accessToken = tokens.access_token

    const now = new Date()
    const expiry = new Date(tokens.token_expiry)
    if (expiry.getTime() - now.getTime() < 5 * 60 * 1000 && tokens.refresh_token) {
      const r = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          refresh_token: tokens.refresh_token,
          grant_type: "refresh_token",
        }),
      })
      const t = await r.json()
      if (r.ok) {
        accessToken = t.access_token
        await supabase.from("google_oauth_tokens").update({
          access_token: t.access_token,
          token_expiry: new Date(Date.now() + t.expires_in * 1000).toISOString(),
        }).limit(1)
      }
    }

    const sheetRange = tokens.sheet_range ?? "Sheet1!A:Z"
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${tokens.sheet_id}/values/${sheetRange}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!res.ok) throw new Error("Failed to read sheet")

    const data = await res.json()
    const rows: string[][] = data.values || []

    const csvRows = rows.map((row: string[]) =>
      row.map((cell: string) => {
        const str = String(cell ?? "")
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }).join(",")
    )

    const csv = csvRows.join("\r\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="spreadsheet-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (err: any) {
    console.error("[SHEETS_DOWNLOAD] Error:", err.message)
    return NextResponse.json({ error: "Failed to download sheet" }, { status: 500 })
  }
}
