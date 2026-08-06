import { PipelineContext } from "../../lib/types.ts";

export async function searchMenu(
  params: { query?: string; category?: string },
  ctx: PipelineContext
) {
  const generic = ["menu", "services", "list", "all", "everything", "show", "available", "catalog", "offer", "have", "product", "item", "option", ""];
  const q = params.query?.toString().toLowerCase().trim() || "";
  const words = q.split(/\s+/).filter(Boolean);
  const isGeneric = !q || words.length === 0 || words.every(w => generic.includes(w));
  let query = ctx.supabase.from("menu_items").select("id, name, description, price, category")
    .eq("workspace_id", ctx.payload.workspace_id).eq("is_available", true);
  if (!isGeneric && params.query) {
    const safe = escapeLike(String(params.query));
    query = query.or(`name.ilike.%${safe}%,category.ilike.%${safe}%,description.ilike.%${safe}%`);
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
      if (searchResult.items && searchResult.items.length > 0) {
        return { success: true, auto_fallback: true, items: searchResult.items, message: "Here are our available items:" };
      }
      return { success: true, message: "No menu available yet. Please contact us directly for more information." };
    }

    if (ctx.payload.is_test) {
      const fileUrl = `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/public/menu-media/${media.file_path}`;
      return { success: true, message: "Menu sent.", media_info: { file_name: media.file_name, file_type: media.file_type, url: fileUrl, type: media.file_type.startsWith("image/") ? "image" : "document" } };
    }

    const pd = await getPhoneAndDevice(ctx);
    if (!pd) return { success: false, error: "Customer phone or WhatsApp device not found" };
    const { phone, deviceId } = pd;

    const gowaKey = Deno.env.get("GOWA_API_KEY");
    if (!gowaKey) return { success: false, error: "WhatsApp not configured" };

    const gowaBase = Deno.env.get("GOWA_BASE_URL")?.replace(/\/$/, "");
    const auth = btoa(gowaKey);
    const fileUrl = `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/public/menu-media/${media.file_path}`;
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

  // Escape backslashes first, then LIKE wildcards and PostgREST filter metacharacters
  const safeName = escapeLike(name);

  const { data: items } = await ctx.supabase
    .from("menu_items")
    .select("id, name, description, price, category, is_available, stock_count")
    .eq("workspace_id", ctx.payload.workspace_id)
    .or(`name.ilike.%${safeName}%,description.ilike.%${safeName}%`)
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
      // Try to get services from workspace profile instead
      const services = ctx.workspace?.services_offered;
      if (services) {
        return { success: true, message: `We don't have a product catalog, but here are our services:\n${services}\n\nWould you like to know more about any of these?` };
      }
      return { success: true, message: "Our catalog is being set up. In the meantime, feel free to ask about our services or contact us directly!" };
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

    if (!ctx.payload.is_test) {
      const pd = await getPhoneAndDevice(ctx);
      if (pd && await sendGowaMessage(pd.deviceId, pd.phone, catalogText)) {
        return { success: true, message: "Catalog sent to customer via WhatsApp.", item_count: items.length, catalog_text: catalogText };
      }
    }
    return { success: true, catalog_text: catalogText, item_count: items.length };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

function escapeLike(s: string): string { return s.replace(/\\/g, '\\\\').replace(/[%_().,]/g, '\\$&'); }

function formatPhoneForGoWA(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) cleaned = "91" + cleaned;
  return cleaned;
}

async function getPhoneAndDevice(ctx: PipelineContext): Promise<{ phone: string; deviceId: string } | null> {
  const { data: sessionRow } = await ctx.supabase
    .from("conversation_sessions")
    .select("customer_jid")
    .eq("id", ctx.session.id)
    .eq("workspace_id", ctx.payload.workspace_id)
    .single();
  const phone = sessionRow?.customer_jid?.split("@")[0];
  if (!phone) return null;
  const { data: gs } = await ctx.supabase
    .from("gowa_sessions")
    .select("gowa_session_id")
    .eq("workspace_id", ctx.payload.workspace_id)
    .maybeSingle();
  return gs?.gowa_session_id ? { phone, deviceId: gs.gowa_session_id } : null;
}

async function sendGowaMessage(deviceId: string, phone: string, message: string): Promise<boolean> {
  const gowaBase = Deno.env.get("GOWA_BASE_URL")?.replace(/\/$/, "");
  const gowaKey = Deno.env.get("GOWA_API_KEY");
  if (!gowaBase || !gowaKey || !deviceId || !phone) return false;
  try {
    const resp = await fetch(`${gowaBase}/send/message`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(gowaKey)}`,
        "Content-Type": "application/json",
        "X-Device-Id": deviceId
      },
      body: JSON.stringify({ phone: formatPhoneForGoWA(phone), message })
    });
    return resp.ok;
  } catch {
    return false;
  }
}

export async function getOrder(
  params: { order_number?: string; order_id?: string },
  ctx: PipelineContext
) {
  const { order_number, order_id } = params;
  if (!order_number && !order_id) {
    return { success: false, error: "Provide either order_number or order_id." };
  }

  let query = ctx.supabase
    .from("orders")
    .select("id, order_number, status, items, subtotal, total, currency, notes, customer_phone, payment_method, payment_ref, payment_verified_at, created_at, updated_at")
    .eq("workspace_id", ctx.payload.workspace_id)
    .is("deleted_at", null);

  if (order_id) query = query.eq("id", order_id);
  else query = query.eq("order_number", order_number);

  const { data: order, error } = await query.maybeSingle();

  if (error || !order) {
    return { success: false, error: `Order not found.` };
  }

  return { success: true, order };
}

export async function trackOrder(
  params: { order_number: string; phone?: string },
  ctx: PipelineContext
) {
  const { order_number, phone } = params;
  if (!order_number) {
    return { success: false, error: "Provide the order number to track." };
  }

  let query = ctx.supabase
    .from("orders")
    .select("order_number, status, items, total, currency, notes, customer_phone, created_at, updated_at")
    .eq("workspace_id", ctx.payload.workspace_id)
    .eq("order_number", order_number)
    .is("deleted_at", null);

  const { data: order, error } = await query.maybeSingle();

  if (error || !order) {
    return { success: false, error: `No order found with number "${order_number}".` };
  }

  // If phone provided, verify it matches the order's customer phone
  if (phone) {
    const orderPhone = (order.customer_phone || "").replace(/\D/g, "");
    const inputPhone = phone.replace(/\D/g, "");
    if (orderPhone && inputPhone && !orderPhone.includes(inputPhone) && !inputPhone.includes(orderPhone)) {
      return { success: false, error: "Order number and phone do not match." };
    }
  }

  const statusLabels: Record<string, string> = {
    pending: "Pending — awaiting payment confirmation",
    paid: "Paid — being processed",
    fulfilled: "Fulfilled — completed",
    cancelled: "Cancelled",
  };

  return {
    success: true,
    tracking: {
      order_number: order.order_number,
      status: order.status,
      status_label: statusLabels[order.status as string] || order.status,
      items: order.items,
      total: order.total,
      currency: order.currency || "INR",
      created_at: order.created_at,
      updated_at: order.updated_at,
    }
  };
}

export async function placeOrder(
  params: { items?: { name: string; qty?: number }[]; item_name?: string; notes?: string },
  ctx: PipelineContext
) {
  let items = params.items || [];
  if (items.length === 0 && params.item_name) items = [{ name: params.item_name, qty: 1 }];
  if (items.length === 0) {
    return { success: false, error: "No items in the order. Ask the customer what they'd like to order." };
  }

  // Resolve each item against menu_items
  const resolved: { name: string; qty: number; price: number }[] = [];
  const unknown: string[] = [];
  for (const it of items) {
    const name = (it.name || "").trim();
    const qty = Math.max(1, Math.floor(Number(it.qty) || 1));
    if (!name) continue;
    const safe = escapeLike(name);
    const { data: matches } = await ctx.supabase
      .from("menu_items")
      .select("name, price, is_available")
      .eq("workspace_id", ctx.payload.workspace_id)
      .eq("is_available", true)
      .ilike("name", `%${safe}%`)
      .order("name")
      .limit(1);
    const match = matches && matches.length > 0 ? matches[0] : null;
    if (!match || !match.price) {
      unknown.push(name);
      continue;
    }
    resolved.push({ name: match.name, qty, price: Number(match.price) });
  }

  if (unknown.length > 0) {
    return {
      success: false,
      error: `These items aren't on the menu: ${unknown.join(", ")}. Ask the customer to pick from the menu.`,
      unknown_items: unknown
    };
  }

  if (resolved.length === 0) {
    return { success: false, error: "No valid items in the order. Ask the customer what they'd like to order." };
  }

  const subtotal = resolved.reduce((sum, it) => sum + it.qty * it.price, 0);
  const total = subtotal;
  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

  const { data: orderSession } = await ctx.supabase
    .from("conversation_sessions")
    .select("contact_id, customer_jid")
    .eq("id", ctx.session.id)
    .eq("workspace_id", ctx.payload.workspace_id)
    .single();

  const customerPhone = (orderSession?.customer_jid || ctx.payload.customer_jid || "").split("@")[0];

  const { data: order, error: insertError } = await ctx.supabase
    .from("orders")
    .insert({
      workspace_id: ctx.payload.workspace_id,
      contact_id: orderSession?.contact_id || null,
      session_id: ctx.session.id,
      order_number: orderNumber,
      items: resolved,
      subtotal,
      total,
      customer_phone: customerPhone || null,
      status: "pending",
      notes: params.notes || null
    })
    .select()
    .single();

  if (insertError || !order) {
    return { success: false, error: "Failed to save the order. Please try again." };
  }

  const itemLines = resolved.map(i => `• ${i.name} × ${i.qty} = ₹${(i.qty * i.price).toLocaleString()}`).join("\n");
  const businessName = ctx.workspace?.name || "us";

  const customerBill = `*Order ${orderNumber}*\n\n${itemLines}\n\n*Total: ₹${total.toLocaleString()}*\n\nThank you for your order! The team at ${businessName} will contact you shortly for payment and delivery details.`;

  const ownerNotice = `*New Order ${orderNumber}*\n\nFrom: ${customerPhone || "unknown"}\n\n${itemLines}\n\n*Total: ₹${total.toLocaleString()}*${params.notes ? `\n\nNotes: ${params.notes}` : ""}\n\nOpen the dashboard to verify payment.`;

  const pd = await getPhoneAndDevice(ctx);
  const deviceId = pd?.deviceId;
  const ownerPhone = ctx.workspace?.owner_personal_phone;

  const [billSent, ownerNotified] = await Promise.all([
    pd && customerPhone ? sendGowaMessage(pd.deviceId, customerPhone, customerBill) : Promise.resolve(false),
    deviceId && ownerPhone ? sendGowaMessage(deviceId, ownerPhone, ownerNotice) : Promise.resolve(false)
  ]);

  // Email fallback when GoWA owner notification fails
  if (!ownerNotified && ownerPhone && ctx.workspace?.owner_id) {
    try {
      const APP_URL = Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://7flowcore.vercel.app";
      const CRON_SECRET = Deno.env.get("INTERNAL_CRON_SECRET") || "";
      const { data: ownerEmail } = await ctx.supabase.rpc("get_user_email", { user_id: ctx.workspace.owner_id });
      if (ownerEmail) {
        await fetch(`${APP_URL}/api/emails/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${CRON_SECRET}` },
          body: JSON.stringify({
            to: ownerEmail,
            subject: `New Order ${orderNumber} — ${businessName}`,
            template: "welcome",
            data: {
              workspaceName: businessName,
              customerName: ctx.session?.customer_name || customerPhone || "A Customer",
              customerEmail: `New order ₹${total.toLocaleString()}. ${params.notes ? `Notes: ${params.notes}` : "Open the dashboard to view details."}`
            }
          }),
        });
      }
    } catch (e: any) {
      console.error("[ORDER] Email fallback notification error:", e.message);
    }
  }

  return {
    success: true,
    order_id: order.id,
    order_number: orderNumber,
    total,
    items: resolved,
    bill_sent: billSent,
    owner_notified: ownerNotified
  };
}
