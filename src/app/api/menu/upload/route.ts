import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { success: isAllowed } = await rateLimit(ip);
    if (!isAllowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspaceId = user.app_metadata?.workspace_id;
    if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 413 });

    const mimeType = file.type;
    const isImage = mimeType.startsWith("image/");
    const isPdf = mimeType === "application/pdf";
    if (!isImage && !isPdf) {
      return NextResponse.json({ error: "Unsupported file type. Upload an image or PDF." }, { status: 400 });
    }

    const ext = isImage ? mimeType.split("/")[1] : "pdf";
    const fileName = `${workspaceId}/${Date.now()}.${ext}`;

    const admin = createAdminClient();
    const { error: uploadError } = await admin.storage
      .from("menu-media")
      .upload(fileName, file, { contentType: mimeType, upsert: false });

    if (uploadError) {
      console.error("[MENU UPLOAD] Storage upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload file to storage." }, { status: 500 });
    }

    const { data: publicUrl } = admin.storage.from("menu-media").getPublicUrl(fileName);

    const { data: media, error: insertError } = await (admin as any)
      .from("menu_media")
      .insert({
        workspace_id: workspaceId,
        file_path: fileName,
        file_type: mimeType,
        file_name: file.name,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[MENU UPLOAD] DB insert error:", insertError);
      return NextResponse.json({ error: "Failed to save media reference." }, { status: 500 });
    }

    return NextResponse.json({ media: { ...media, public_url: publicUrl.publicUrl } });
  } catch (e: any) {
    console.error("Menu upload error:", e);
    return NextResponse.json({ error: "Failed to process menu upload" }, { status: 500 });
  }
}
