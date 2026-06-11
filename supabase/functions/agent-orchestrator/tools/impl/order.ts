import { PipelineContext } from "../../lib/types.ts";

export async function searchMenu(
  params: { query?: string; category?: string },
  ctx: PipelineContext
) {
  const generic = ["menu", "services", "list", "all", "everything", "show", "available", ""];
  const isGeneric = !params.query || generic.includes(params.query?.toString().toLowerCase().trim());
  let query = ctx.supabase.from("menu_items").select("id, name, description, price, category")
    .eq("workspace_id", ctx.payload.workspace_id).eq("is_available", true);
  if (!isGeneric && params.query) {
    query = query.or(`name.ilike.%${params.query}%,category.ilike.%${params.query}%,description.ilike.%${params.query}%`);
  }
  if (params.category) query = query.eq("category", params.category);
  const { data: items } = await query.order("name").limit(20);
  return { success: true, items: items || [] };
}

export async function sendMenuMedia(
  params: { caption?: string },
  ctx: PipelineContext
) {
  try {
    const { data: media } = await ctx.supabase
      .from("menu_media")
      .select("file_path, file_type, file_name")
      .eq("workspace_id", ctx.payload.workspace_id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!media) {
      const searchResult = await searchMenu({ query: "", category: undefined }, ctx);
      return { success: true, auto_fallback: true, items: searchResult.items, message: "No uploaded menu image. Here are our items instead." };
    }

    if (ctx.payload.is_test) {
      const fileUrl = `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/public/menu-media/${media.file_path}`;
      return { success: true, message: "Menu sent.", media_info: { file_name: media.file_name, file_type: media.file_type, url: fileUrl, type: media.file_type.startsWith("image/") ? "image" : "document" } };
    }

    const gowaBase = Deno.env.get("GOWA_BASE_URL")?.replace(/\/$/, "");
    const gowaKey = Deno.env.get("GOWA_API_KEY");
    if (!gowaBase || !gowaKey) return { success: false, error: "WhatsApp not configured" };

    const { data: sessionData } = await ctx.supabase
      .from("conversation_sessions")
      .select("customer_jid, contact:contacts(phone), gowa_session:gowa_sessions!workspace_id(gowa_session_id)")
      .eq("id", ctx.session.id)
      .eq("workspace_id", ctx.payload.workspace_id)
      .single();
    if (!sessionData) return { success: false, error: "Session not found" };
    const deviceId = sessionData.gowa_session?.gowa_session_id;
    if (!deviceId) return { success: false, error: "WhatsApp device not connected" };

    let phone = sessionData.customer_jid?.split("@")[0] || sessionData.contact?.phone;
    if (!phone) return { success: false, error: "Customer phone not found" };

    const fileUrl = `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/public/menu-media/${media.file_path}`;
    const auth = btoa(gowaKey);
    const formattedPhone = formatPhoneForGoWA(phone);
    const caption = params.caption || "Here is our menu — take a look!";
    const isImage = media.file_type.startsWith("image/");

    let resp: Response;
    if (isImage) {
      resp = await fetch(`${gowaBase}/send/image`, {
        method: "POST",
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json", "X-Device-Id": deviceId },
        body: JSON.stringify({ phone: formattedPhone, image_url: fileUrl, caption })
      });
    } else {
      resp = await fetch(`${gowaBase}/send/message`, {
        method: "POST",
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json", "X-Device-Id": deviceId },
        body: JSON.stringify({ phone: formattedPhone, message: `${caption}\n\n📄 View Menu: ${fileUrl}` })
      });
    }
    if (!resp.ok) return { success: false, error: "Failed to send menu via WhatsApp" };
    return { success: true, message: "Menu sent to customer via WhatsApp." };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function checkStock(
  params: { product_name: string },
  ctx: PipelineContext
) {
  const name = params.product_name?.trim();
  if (!name) return { success: false, error: "product_name is required" };

  const { data: items } = await ctx.supabase
    .from("menu_items")
    .select("id, name, description, price, category, is_available, stock_count")
    .eq("workspace_id", ctx.payload.workspace_id)
    .or(`name.ilike.%${name}%,description.ilike.%${name}%`)
    .order("name")
    .limit(5);

  if (!items || items.length === 0) {
    return { success: true, found: false, message: `No product found matching "${name}".` };
  }

  const results = items.map((item: any) => ({
    name: item.name,
    price: item.price,
    category: item.category,
    in_stock: item.is_available,
    stock_count: item.stock_count ?? null,
    description: item.description
  }));

  const inStock = results.filter((r: any) => r.in_stock);
  const outOfStock = results.filter((r: any) => !r.in_stock);

  return {
    success: true,
    found: true,
    items: results,
    summary: inStock.length > 0
      ? `${inStock.length} item(s) available${outOfStock.length > 0 ? `, ${outOfStock.length} out of stock` : ""}`
      : `All ${results.length} matching item(s) are currently out of stock`
  };
}

export async function sendCatalog(
  params: { category?: string },
  ctx: PipelineContext
) {
  try {
    let query = ctx.supabase
      .from("menu_items")
      .select("name, price, category, description, is_available")
      .eq("workspace_id", ctx.payload.workspace_id)
      .order("category")
      .order("name");

    if (params.category) query = query.eq("category", params.category);

    const { data: items } = await query.limit(50);
    if (!items || items.length === 0) {
      return { success: true, message: "No products found in the catalog." };
    }

    // Group by category
    const grouped: Record<string, any[]> = {};
    for (const item of items) {
      const cat = item.category || "Other";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    }

    // Format catalog text
    const lines: string[] = ["*Product Catalog*\n"];
    for (const [cat, catItems] of Object.entries(grouped)) {
      lines.push(`*${cat}*`);
      for (const item of catItems) {
        const stock = item.is_available ? "" : " _(out of stock)_";
        lines.push(`  ${item.name} — ₹${item.price}${stock}`);
      }
      lines.push("");
    }
    lines.push(`_Total: ${items.length} products_`);
    const catalogText = lines.join("\n").trim();

    if (ctx.payload.is_test) {
      return { success: true, catalog_text: catalogText, item_count: items.length };
    }

    // Send via WhatsApp
    const gowaBase = Deno.env.get("GOWA_BASE_URL")?.replace(/\/$/, "");
    const gowaKey = Deno.env.get("GOWA_API_KEY");
    if (!gowaBase || !gowaKey) return { success: false, error: "WhatsApp not configured" };

    const { data: sessionData } = await ctx.supabase
      .from("conversation_sessions")
      .select("customer_jid, contact:contacts(phone), gowa_session:gowa_sessions!workspace_id(gowa_session_id)")
      .eq("id", ctx.session.id)
      .eq("workspace_id", ctx.payload.workspace_id)
      .single();
    if (!sessionData) return { success: false, error: "Session not found" };
    const deviceId = sessionData.gowa_session?.gowa_session_id;
    if (!deviceId) return { success: false, error: "WhatsApp device not connected" };

    let phone = sessionData.customer_jid?.split("@")[0] || sessionData.contact?.phone;
    if (!phone) return { success: false, error: "Customer phone not found" };

    const auth = btoa(gowaKey);
    const formattedPhone = formatPhoneForGoWA(phone);
    const resp = await fetch(`${gowaBase}/send/message`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json", "X-Device-Id": deviceId },
      body: JSON.stringify({ phone: formattedPhone, message: catalogText })
    });

    if (!resp.ok) return { success: false, error: "Failed to send catalog via WhatsApp" };
    return { success: true, message: "Catalog sent to customer via WhatsApp.", item_count: items.length };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

function formatPhoneForGoWA(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) cleaned = "91" + cleaned;
  return cleaned;
}
