import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import { randomUUID } from "crypto"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const INTERNAL_SECRET = process.env.INTERNAL_CRON_SECRET

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing env vars")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function testDocxIngestion() {
  console.log("=== DOCX Ingestion Test ===")

  const { data: workspace } = await supabase.from("workspaces").select("id").limit(1).single()
  if (!workspace) { console.error("No workspace found"); return }
  console.log("Workspace:", workspace.id)

  const fileBuf = fs.readFileSync("C:/Users/PC/AppData/Local/Temp/test-doc.docx")
  const storagePath = `test-uploads/${randomUUID()}.docx`
  const { error: uploadError } = await supabase.storage.from("kb-documents").upload(storagePath, fileBuf, {
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    upsert: true,
  })
  if (uploadError) { console.error("Upload failed:", uploadError); return }
  console.log("Uploaded:", storagePath)

  const { data: source, error: sourceError } = await supabase
    .from("kb_sources")
    .insert({ workspace_id: workspace.id, label: "Test DOCX", source_type: "docx", storage_path: storagePath, status: "pending" })
    .select()
    .single()
  if (sourceError) { console.error("Source creation failed:", sourceError); return }
  console.log("Source ID:", source.id)

  // Try invoking with INTERNAL_CRON_SECRET instead
  const { error: fnError } = await supabase.functions.invoke("ingest-document", {
    body: { workspace_id: workspace.id, source_id: source.id, storage_path: storagePath },
    headers: INTERNAL_SECRET ? { Authorization: `Bearer ${INTERNAL_SECRET}` } : undefined,
  })
  if (fnError) {
    console.error("Function failed:", fnError)
    // Check source status anyway
    const { data: s } = await supabase.from("kb_sources").select("status, error_message").eq("id", source.id).single()
    console.log("Source status after failure:", s?.status, s?.error_message)
    return
  }
  console.log("Function invoked successfully")

  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 2000))
    const { data: s } = await supabase.from("kb_sources").select("status, error_message, chunk_count").eq("id", source.id).single()
    console.log(`  Status: ${s?.status} | Error: ${s?.error_message || "none"} | Chunks: ${s?.chunk_count || 0}`)
    if (s?.status === "active" || s?.status === "failed") break
  }

  const { data: chunks } = await supabase.from("kb_chunks").select("content").eq("source_id", source.id)
  console.log("\n=== Result ===")
  console.log("Chunks found:", chunks?.length || 0)
  if (chunks?.length) {
    console.log("First chunk:", chunks[0].content.substring(0, 120))
  }
}

testDocxIngestion().catch(console.error)
