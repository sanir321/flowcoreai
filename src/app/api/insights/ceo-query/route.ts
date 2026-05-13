import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new NextResponse("Unauthorized", { status: 401 })

    const workspaceId = user.app_metadata.workspace_id
    if (!workspaceId) return new NextResponse("No workspace", { status: 400 })

    const { message, agent_type, reasoning, contact_id } = await req.json()

    // 1. Time Ranges
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()

    // 2. Fetch Core Metrics (Current vs Previous Week)
    const [
      curMsgs, prevMsgs, 
      curLeads, prevLeads, 
      curEscs, prevEscs,
      gowaStatus,
      googleConfig,
      kbCount,
      specificContact
    ] = await Promise.all([
      // Current Week
      supabase.from("messages").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).gte("created_at", sevenDaysAgo),
      // Previous Week
      supabase.from("messages").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).gte("created_at", fourteenDaysAgo).lt("created_at", sevenDaysAgo),
      // Leads (Contacts)
      supabase.from("contacts").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).gte("created_at", sevenDaysAgo),
      supabase.from("contacts").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).gte("created_at", fourteenDaysAgo).lt("created_at", sevenDaysAgo),
      // Escalations
      supabase.from("conversation_sessions").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("status", "escalated").gte("updated_at", sevenDaysAgo),
      supabase.from("conversation_sessions").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("status", "escalated").gte("updated_at", fourteenDaysAgo).lt("updated_at", sevenDaysAgo),
      // Infrastructure
      supabase.from("gowa_sessions").select("status, gowa_session_id").eq("workspace_id", workspaceId).maybeSingle(),
      supabase.from("google_oauth_tokens").select("calendar_id, sheet_id").eq("workspace_id", workspaceId).maybeSingle(),
      supabase.from("kb_chunks").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId),
      // Optional: Specific Contact Context
      contact_id ? supabase.from("contacts").select("*").eq("id", contact_id).single() : Promise.resolve(null)
    ])

    const stats = {
      messages: { current: curMsgs.count || 0, previous: prevMsgs.count || 0 },
      leads: { current: curLeads.count || 0, previous: prevLeads.count || 0 },
      escalations: { current: curEscs.count || 0, previous: prevEscs.count || 0 },
      autonomy: Math.round((1 - ((curEscs.count || 0) / (curMsgs.count || 1))) * 100)
    }

    const infra = {
      whatsapp: gowaStatus.data?.status || 'disconnected',
      google_calendar: googleConfig.data?.calendar_id ? 'connected' : 'not configured',
      google_sheets: googleConfig.data?.sheet_id ? 'connected' : 'not configured',
      knowledge_base_size: kbCount.count || 0
    }

    const systemPrompt = `You are the FlowCore CEO Analyst, a high-level business intelligence agent.
Your goal is to provide deep, actionable insights based on the real-time performance data of this workspace.

WORKSPACE CONTEXT:
- Mode: ${agent_type}
- Reasoning Level: ${reasoning}
${specificContact && (specificContact as any).data ? `- Targeted Contact Analysis: ${JSON.stringify((specificContact as any).data)}` : ''}

PERFORMANCE DATA (Last 7 Days vs Previous 7 Days):
- Messages: ${stats.messages.current} (${stats.messages.current >= stats.messages.previous ? '+' : ''}${stats.messages.current - stats.messages.previous})
- Leads Captured: ${stats.leads.current} (${stats.leads.current >= stats.leads.previous ? '+' : ''}${stats.leads.current - stats.leads.previous})
- AI Autonomy Rate: ${stats.autonomy}%
- Human Escalations: ${stats.escalations.current}

INFRASTRUCTURE STATUS:
- WhatsApp: ${infra.whatsapp}
- Google Calendar: ${infra.google_calendar}
- Google Sheets: ${infra.google_sheets}
- Knowledge Base: ${infra.knowledge_base_size} chunks indexed

REQUIRED OUTPUT FORMAT:
You MUST format your entire response using this exact structure:
Reasoning: [1-2 sentences explaining your data analysis logic]
Response: [Your detailed CEO-level markdown analysis and recommendations]

GUIDELINES:
1. Be direct and "CEO-level". Don't waste time on fluff.
2. If WhatsApp is disconnected, flag it as a P0 priority.
3. Use the performance trends to suggest improvements.
4. Format with clean Markdown. Use bolding for key metrics.`;

    const groqApiKey = process.env.GROQ_API_KEY;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.3,
        max_tokens: 300
      })
    });

    if (!response.ok) throw new Error(`Groq AI Error: ${response.status}`);

    const result = await response.json();
    const rawText = result.choices?.[0]?.message?.content || "No analysis available.";

    // Improved parsing for Reasoning vs Response
    let reply = rawText;
    let thought = "";

    // Regex to capture Reasoning and Response blocks
    const thoughtMatch = rawText.match(/(?:Reasoning|Thought):\s*([\s\S]*?)(?:Response|Output|Answer|Final Response):\s*([\s\S]*)/i);
    
    if (thoughtMatch) {
        thought = thoughtMatch[1].trim();
        reply = thoughtMatch[2].trim();
    } else {
        // Fallback: Check if response starts with marker
        const responseIndex = rawText.search(/(?:Response|Output|Answer|Final Response):\s*/i);
        if (responseIndex !== -1) {
            const parts = rawText.split(/(?:Response|Output|Answer|Final Response):\s*/i);
            if (parts.length > 1) {
                reply = parts[1].trim();
                thought = parts[0].replace(/(?:Reasoning|Thought):\s*/i, '').trim();
            }
        }
    }

    return NextResponse.json({ reply, thought });

  } catch (error: any) {
    console.error("CEO Analyst Error:", error)
    return NextResponse.json({ reply: "I'm having trouble accessing your workspace data right now. Please check your integrations and try again." }, { status: 500 })
  }
}
