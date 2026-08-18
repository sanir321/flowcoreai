import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text, businessType } = await req.json();

    if (!text || text.length < 10) {
      return NextResponse.json({ error: "Text too short" }, { status: 400 });
    }

    const OPENCODE_ZEN_API_KEY = process.env.OPENCODE_ZEN_API_KEY;
    if (!OPENCODE_ZEN_API_KEY) {
      return NextResponse.json({ error: "Missing OPENCODE_ZEN_API_KEY" }, { status: 500 });
    }

    const systemPrompt = `You are an expert AI that extracts business profile information from raw text.
Extract the following information and return ONLY a valid JSON object. Do not include markdown formatting or backticks.
Schema:
{
  "contact": { "phone": "", "email": "", "address": "", "google_maps_link": "" },
  "social": { "instagram": "", "facebook": "", "twitter": "", "linkedin": "", "youtube": "", "whatsapp": "" },
  "hours": {
    "daily": {
      "monday": { "open": "09:00", "close": "17:00", "closed": false },
      "tuesday": { "open": "09:00", "close": "17:00", "closed": false },
      "wednesday": { "open": "09:00", "close": "17:00", "closed": false },
      "thursday": { "open": "09:00", "close": "17:00", "closed": false },
      "friday": { "open": "09:00", "close": "17:00", "closed": false },
      "saturday": { "open": "09:00", "close": "17:00", "closed": true },
      "sunday": { "open": "09:00", "close": "17:00", "closed": true }
    }
  },
  "policies": { "refund": "", "payment": "", "cancellation": "", "warranty": "" },
  "amenities": ["string"],
  "pricing": { "description": "", "currency": "INR" },
  "extras": {}
}

Business Type: ${businessType || 'general'}
Text to extract from:
${text}

Fill as much as possible. If a value is unknown, leave it empty or default.`;

    const response = await fetch("https://api.opencodezen.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENCODE_ZEN_API_KEY}`,
      },
      body: JSON.stringify({
        model: "nemotron-3-ultra-free",
        messages: [{ role: "user", content: systemPrompt }],
        temperature: 0,
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM API Error: ${response.statusText}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "{}";
    
    // Clean up potential markdown formatting from LLM
    content = content.replace(/^```json/g, '').replace(/```$/g, '').trim();

    const extracted = JSON.parse(content);
    return NextResponse.json({ success: true, extracted });
  } catch (error: any) {
    console.error("Extraction error:", error);
    return NextResponse.json({ error: error.message || "Extraction failed" }, { status: 500 });
  }
}
