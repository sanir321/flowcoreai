import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const CreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  price: z.number().positive(),
  category: z.string().optional(),
  is_available: z.boolean().optional().default(true),
});

const UpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  category: z.string().optional(),
  is_available: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspaceId = user.app_metadata?.workspace_id;
    if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    let query = supabase.from("menu_items").select("*").eq("workspace_id", workspaceId).is("deleted_at", null);
    if (category) query = query.eq("category", category);
    query = query.order("category").order("name");

    const { data: items, error } = await query;
    if (error) throw error;

    return NextResponse.json({ items: items || [] });
  } catch (e: any) {
    console.error("Menu GET error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspaceId = user.app_metadata?.workspace_id;
    if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

    const body = await req.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const { data, error } = await supabase
      .from("menu_items")
      .insert({ ...parsed.data, workspace_id: workspaceId })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ item: data });
  } catch (e: any) {
    console.error("Menu POST error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspaceId = user.app_metadata?.workspace_id;
    if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const { id, ...updates } = parsed.data;
    const { data, error } = await supabase
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
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspaceId = user.app_metadata?.workspace_id;
    if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
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
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
