import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY!;
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

const EXTRACT_PROMPT = `You are a menu extraction assistant. Extract ALL menu items from this restaurant/service menu.

Return a JSON object with an "items" array. Each item has these fields:
- name (string, required): Item name
- price (number, required): Price in INR (if no currency specified, assume INR). Only the number, no symbol.
- description (string, optional): Brief description of the item
- category (string, optional): Category/group this item belongs to (e.g., "Starters", "Main Course", "Treatments", "Services")

Rules:
- Extract EVERY item visible in the menu
- If a price range is given (e.g., ₹500-1000), use the lower price
- If items have modifiers/add-ons, skip those and extract only the base item
- Respond with ONLY valid JSON, no markdown, no explanation outside the JSON`;

function extractPdfText(buffer: Buffer): string {
  const raw = buffer.toString("binary");
  const parens: string[] = [];
  const re = /\(([^)]*)\)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(raw)) !== null) {
    const text = match[1];
    if (text && text.length > 2 && /[a-zA-Z0-9]/.test(text)) {
      parens.push(text);
    }
  }
  return parens.join("\n");
}

async function groqChatCompletion(body: Record<string, unknown>): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Groq API ${res.status}: ${errBody.slice(0, 500)}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

const EXTRACT_PROMPT_VISION = `Extract ALL menu items from this image. Return ONLY a JSON array of objects. Each object has these exact fields:

- name: string (item name)
- price: number (price in INR, no currency symbol)
- description: string (optional, brief description)
- category: string (optional, category like "Starters", "Main Course", "Treatments", "Services")

Rules:
- Extract EVERY item
- If a price range (e.g., ₹500-1000), use the lower price
- Respond with ONLY the raw JSON array, nothing else`;

function tryParseJSON(text: string): any[] {
  const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*$/g, "").trim();
  let start = cleaned.indexOf("[");
  let end = cleaned.lastIndexOf("]");
  if (start !== -1 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch {}
  }
  start = cleaned.indexOf("{");
  end = cleaned.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try { const o = JSON.parse(cleaned.slice(start, end + 1)); return Array.isArray(o.items) ? o.items : Array.isArray(o) ? o : []; } catch {}
  }
  try { const p = JSON.parse(cleaned); return Array.isArray(p.items) ? p.items : Array.isArray(p) ? p : []; } catch {}
  return [];
}

async function extractWithVision(buffer: Buffer, mimeType: string): Promise<any[]> {
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const response = await groqChatCompletion({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: EXTRACT_PROMPT_VISION },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
    temperature: 0.3,
    max_completion_tokens: 4096,
  });

  const text = response.choices?.[0]?.message?.content || "";
  console.log(`[MENU UPLOAD] Groq vision raw response (first 500 chars):`, text.slice(0, 500));
  return tryParseJSON(text);
}

async function extractFromPdfText(buffer: Buffer): Promise<any[]> {
  const rawText = extractPdfText(buffer);
  if (!rawText.trim()) throw new Error("Could not extract text from this PDF");

  const response = await groqChatCompletion({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: EXTRACT_PROMPT_VISION },
      { role: "user", content: `Extract menu items from this text:\n\n${rawText.slice(0, 8000)}` },
    ],
    temperature: 0.3,
    max_completion_tokens: 4096,
  });

  const text = response.choices?.[0]?.message?.content || "";
  console.log(`[MENU UPLOAD] Groq text raw response (first 500 chars):`, text.slice(0, 500));
  return tryParseJSON(text);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspaceId = user.app_metadata?.workspace_id;
    if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type;
    const isImage = mimeType.startsWith("image/");
    const isPdf = mimeType === "application/pdf";

    if (!isImage && !isPdf) {
      return NextResponse.json({ error: "Unsupported file type. Upload an image or PDF." }, { status: 400 });
    }

    let items: any[];
    if (isImage) {
      items = await extractWithVision(buffer, mimeType);
    } else {
      items = await extractFromPdfText(buffer);
    }

    console.log(`[MENU UPLOAD] Extracted ${items.length} raw items from image:`, JSON.stringify(items.slice(0, 3)));

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Could not extract any menu items from this file." }, { status: 422 });
    }

    const validItems = items.filter((i: any) => {
      const hasName = i.name && typeof i.name === "string";
      const hasPrice = typeof i.price === "number" || typeof i.price === "string";
      const priceNum = typeof i.price === "number" ? i.price : parseFloat(i.price);
      return hasName && hasPrice && priceNum > 0;
    }).map((i: any) => ({
      ...i,
      price: typeof i.price === "number" ? i.price : parseFloat(i.price),
    }));

    console.log(`[MENU UPLOAD] Valid items after filter: ${validItems.length}`);

    if (validItems.length === 0) {
      return NextResponse.json({ error: "Could not parse item names and prices from this menu." }, { status: 422 });
    }

    const inserted: any[] = [];
    for (const item of validItems) {
      const { data, error } = await supabase
        .from("menu_items")
        .insert({
          workspace_id: workspaceId,
          name: item.name.trim(),
          price: item.price,
          description: item.description?.trim() || null,
          category: item.category?.trim() || null,
          is_available: true,
        })
        .select()
        .single();

      if (error) {
        console.error(`[MENU UPLOAD] Insert error for "${item.name}":`, error);
      } else if (data) {
        inserted.push(data);
      }
    }

    console.log(`[MENU UPLOAD] Successfully inserted ${inserted.length} of ${validItems.length} items`);
    return NextResponse.json({ items: inserted, count: inserted.length });
  } catch (e: any) {
    console.error("Menu upload error:", e);
    return NextResponse.json({ error: e.message || "Failed to process menu upload" }, { status: 500 });
  }
}
