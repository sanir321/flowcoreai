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

export async function createOrder(
  params: { items?: { menu_item_id?: string; name: string; qty?: number; price?: number }[]; notes?: string },
  ctx: PipelineContext
) {
  const { data: session } = await ctx.supabase.from("conversation_sessions").select("contact_id").eq("id", ctx.session.id).single();
  const { data: workspace } = await ctx.supabase.from("workspaces").select("upi_id").eq("id", ctx.payload.workspace_id).single();
  const rawItems = params.items || [];
  const items = Array.isArray(rawItems) ? rawItems : [];

  // Look up actual prices from the database to prevent LLM price hallucination
  const { data: menuItems } = await ctx.supabase
    .from("menu_items")
    .select("id, name, price")
    .eq("workspace_id", ctx.payload.workspace_id)
    .eq("is_available", true);
  const menuMap = new Map<string, number>();
  const menuIdMap = new Map<string, number>();
  if (menuItems) {
    for (const mi of menuItems) {
      menuMap.set(mi.name.toLowerCase(), Number(mi.price));
      menuIdMap.set(mi.id, Number(mi.price));
    }
  }

  for (const item of items) {
    let dbPrice: number | undefined;
    if (item.menu_item_id && menuIdMap.has(item.menu_item_id)) {
      dbPrice = menuIdMap.get(item.menu_item_id);
    } else if (item.name) {
      const itemName = item.name.toLowerCase().trim();
      for (const [menuName, price] of menuMap) {
        if (menuName.includes(itemName) || itemName.includes(menuName.split("(")[0].trim())) {
          dbPrice = price;
          break;
        }
      }
    }
    if (dbPrice !== undefined) item.price = dbPrice;
  }

  const subtotal = items.reduce((sum, i) => sum + (i.qty || 1) * (i.price || 0), 0);
  const tax = Math.round(subtotal * 0.18 * 100) / 100;
  const total = subtotal + tax;
  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
  const upiId = workspace?.upi_id || "flowcoreai@upi";
  const upiLink = `upi://pay?pa=${upiId}&am=${total}&tn=Order%20${orderNumber}&cu=INR`;
  const { data: order } = await ctx.supabase.from("orders").insert({
    workspace_id: ctx.payload.workspace_id,
    contact_id: session?.contact_id || null,
    session_id: ctx.session.id,
    order_number: orderNumber, items, subtotal, tax, total,
    status: "pending", upi_link: upiLink, notes: params.notes || null
  }).select().single();
  const orderText = `*Order ${orderNumber}*\n\n${items.map(i => `${i.name} × ${i.qty || 1} = ₹${((i.qty || 1) * i.price).toLocaleString()}`).join("\n")}\n\nSubtotal: ₹${subtotal.toLocaleString()}\nTax (18%): ₹${tax.toLocaleString()}\n*Total: ₹${total.toLocaleString()}*\n\n*Pay via UPI:* ${upiLink}\n\nReply with your payment confirmation or ask for help.`;
  return { success: true, order_id: order?.id, order_number: orderNumber, total, upi_link: upiLink, order_text: orderText };
}

export async function confirmPayment(
  params: { order_id?: string; order_number?: string; payment_method?: string; transaction_id?: string; proof?: string },
  ctx: PipelineContext
) {
  const transactionId = params.transaction_id || params.proof;
  if (!transactionId) {
    return { error: "Payment verification requires a transaction ID or payment proof. Please provide a UPI reference number or screenshot." };
  }
  console.log(`[confirmPayment] Verification: transaction_id=${transactionId}`);
  let orderId = params.order_id || "";
  let orderNum = params.order_number || "";
  if (!orderId && !orderNum) return { error: "Provide order_id or order_number" };
  if (orderId && orderId.startsWith("ORD-")) { orderNum = orderId; orderId = ""; }
  let query = ctx.supabase.from("orders").update({
    status: "paid", payment_method: params.payment_method || "upi", transaction_id: transactionId, updated_at: new Date().toISOString()
  }).eq("workspace_id", ctx.payload.workspace_id);
  if (orderId) query = query.eq("id", orderId);
  else query = query.eq("order_number", orderNum);
  const { data: order } = await query.select().single();
  if (!order) return { error: "Order not found" };
  return { success: true, order_id: order.id, order_number: order.order_number, status: "paid" };
}

export async function getOrderStatus(
  params: { order_id?: string; order_number?: string },
  ctx: PipelineContext
) {
  let orderId = params.order_id || "";
  let orderNum = params.order_number || "";
  if (!orderId && !orderNum) return { error: "Provide order_id or order_number" };
  if (orderId && orderId.startsWith("ORD-")) { orderNum = orderId; orderId = ""; }
  let query = ctx.supabase.from("orders").select("*").eq("workspace_id", ctx.payload.workspace_id);
  if (orderId) query = query.eq("id", orderId);
  else query = query.eq("order_number", orderNum);
  const { data: order } = await query.single();
  if (!order) return { error: "Order not found" };
  return { success: true, order_number: order.order_number, status: order.status, total: order.total, items: order.items, upi_link: order.upi_link, created_at: order.created_at };
}

function formatPhoneForGoWA(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) cleaned = "91" + cleaned;
  return cleaned;
}
