import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { workspace_id, source_id, url } = await req.json()
    if (!workspace_id || !source_id || !url) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const tinyfishKey = process.env.TINYFISH_API_KEY
    if (!tinyfishKey) {
      return NextResponse.json({ error: "TINYFISH_API_KEY not configured" }, { status: 501 })
    }

    await supabase.from("kb_sources").update({ status: "processing", error_message: "Fetching via TinyFish..." }).eq("id", source_id)

    const tfRes = await fetch("https://api.tinyfish.ai/v1/fetch-content", {
      method: "POST",
      headers: { Authorization: `Bearer ${tinyfishKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, format: "markdown" }),
    })

    if (!tfRes.ok) throw new Error(`TinyFish fetch failed: ${tfRes.statusText}`)
    const tfData = await tfRes.json()
    const text = tfData?.content || ""
    if (text.length < 10) throw new Error("No meaningful content extracted")

    await supabase.from("kb_sources").update({ error_message: "TinyFish extracted text. Embedding..." }).eq("id", source_id)

    const secret = process.env.INTERNAL_CRON_SECRET
    await supabase.functions.invoke("embed-text", {
      body: { workspace_id, source_id, content: text },
      headers: { Authorization: `Bearer ${secret}` },
    })

    return NextResponse.json({ success: true, chars: text.length })
  } catch (err: any) {
    console.error("[TINYFISH_INGEST_ERROR]", err)
    try {
      const body = await req.clone().json()
      if (body.source_id) {
        await supabase.from("kb_sources").update({ status: "failed", error_message: err.message }).eq("id", body.source_id)
      }
    } catch {}
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 })
  }
}
