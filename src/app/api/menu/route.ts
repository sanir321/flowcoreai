import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { getUserWorkspaceId } from "@/lib/workspace-auth";

/* eslint-disable @typescript-eslint/no-explicit-any */

const CreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  price: z.number().positive(),
  category: z.string().optional(),
  is_available: z.boolean().optional().default(true),
  stock_count: z.number().int().min(0).optional(),
});

const MenuGetSchema = z.object({
  category: z.string().optional(),
  type: z.enum(["media", "items"]).optional(),
});

const MenuDeleteSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["media"]).optional(),
});

const UpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  category: z.string().optional(),
  is_available: z.boolean().optional(),
  stock_count: z.number().int().min(0).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { success: isAllowed } = await rateLimit(ip);
    if (!isAllowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspaceId = await getUserWorkspaceId(supabase, user.id);
    if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

    const { searchParams } = new URL(req.url);
    const getParsed = MenuGetSchema.safeParse({
      category: searchParams.get("category"),
      type: searchParams.get("type"),
    });
    if (!getParsed.success) {
      return NextResponse.json({ error: getParsed.error.flatten() }, { status: 400 });
    }
    const { category, type } = getParsed.data;

    if (type === "media") {
      const admin = createAdminClient();
      const { data: media, error } = await (admin as any)
        .from("menu_media")
        .select("*")
        .eq("workspace_id", workspaceId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mediaWithUrls = ((media as any[]) || []).map((m: any) => ({
        ...m,
        public_url: admin.storage.from("menu-media").getPublicUrl(m.file_path).data.publicUrl,
      }));

      return NextResponse.json({ media: mediaWithUrls });
    }

    let query = supabase.from("menu_items").select("*").eq("workspace_id", workspaceId).is("deleted_at", null);
    if (category) query = query.eq("category", category);
    query = query.order("category").order("name");

    const { data: items, error } = await query;
    if (error) throw error;

    return NextResponse.json({ items: items || [] });
  } catch (e: any) {
    console.error("Menu GET error:", e);
    return NextResponse.json({ error: "Failed to fetch menu items" }, { status: 500 });
  }
}

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

    // Get workspace ID via DB lookup (not stale JWT app_metadata)
    const workspaceId = await getUserWorkspaceId(supabase, user.id);
    if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

    const body = await req.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const { data, error } = await (supabase as any)
      .from("menu_items")
      .insert({ ...parsed.data, workspace_id: workspaceId })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ item: data });
  } catch (e: any) {
    console.error("Menu POST error:", e);
    return NextResponse.json({ error: "Failed to create menu item" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { success: isAllowed } = await rateLimit(ip);
    if (!isAllowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get workspace ID via DB lookup (not stale JWT app_metadata)
    const workspaceId = await getUserWorkspaceId(supabase, user.id);
    if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const { id, ...updates } = parsed.data;
    const { data, error } = await (supabase as any)
      .from("menu_items")
      .update(updates)
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ item: data });
  } catch (e: any) {
    console.error("Menu PUT error:", e);
    return NextResponse.json({ error: "Failed to update menu item" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { success: isAllowed } = await rateLimit(ip);
    if (!isAllowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get workspace ID via DB lookup (not stale JWT app_metadata)
    const workspaceId = await getUserWorkspaceId(supabase, user.id);
    if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

    const { searchParams } = new URL(req.url);
    const deleteParsed = MenuDeleteSchema.safeParse({
      id: searchParams.get("id"),
      type: searchParams.get("type"),
    });
    if (!deleteParsed.success) {
      return NextResponse.json({ error: deleteParsed.error.flatten() }, { status: 400 });
    }
    const { id, type } = deleteParsed.data;

    if (type === "media") {
      const admin = createAdminClient();
      const { data: media } = await (admin as any).from("menu_media").select("file_path").eq("id", id).eq("workspace_id", workspaceId).single();
      if (media) {
        await admin.storage.from("menu-media").remove([(media as any).file_path]);
        await (admin as any).from("menu_media").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      }
      return NextResponse.json({ success: true });
    }

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const { error } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", id)
      .eq("workspace_id", workspaceId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Menu DELETE error:", e);
    return NextResponse.json({ error: "Failed to delete menu item" }, { status: 500 });
  }
}
