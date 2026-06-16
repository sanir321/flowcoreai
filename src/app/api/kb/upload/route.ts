import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const workspace_id = user.app_metadata?.workspace_id
    if (!workspace_id) return NextResponse.json({ error: "No workspace" }, { status: 400 })

    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Allowed: PDF, DOCX, TXT, MD" }, { status: 400 })
    }

    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const storagePath = `${workspace_id}/${fileName}`

    const { data, error } = await supabase.storage
      .from('kb-documents')
      .upload(storagePath, file)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ storage_path: data.path })
  } catch (err: any) {
    console.error("[KB_UPLOAD] Error:", err)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}