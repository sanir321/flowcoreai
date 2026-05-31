var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (fn, mod) => function __require() {
  return mod || (0, fn[__getOwnPropNames(fn)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// tools/impl/contact.ts
var require_contact = __commonJS({
  "tools/impl/contact.ts"(exports, module) {
    "use strict";
    module.exports = { getContactDetails, updateContact };
    async function getContactDetails(ctx) {
      const { data: session } = await ctx.supabase.from("conversation_sessions").select("contact_id").eq("id", ctx.session.id).single();
      if (!session?.contact_id) return { error: "Contact not found" };
      const { data: contact } = await ctx.supabase.from("contacts").select("*").eq("id", session.contact_id).single();
      const { data: byContact } = await ctx.supabase.from("appointments").select("*").eq("contact_id", session.contact_id).order("created_at", { ascending: false });
      const { data: bySession } = await ctx.supabase.from("appointments").select("*").eq("session_id", ctx.session.id).order("created_at", { ascending: false });
      const appointments = byContact || bySession || [];
      return { contact, appointments };
    }
    async function updateContact(ctx, params) {
      const { data: session } = await ctx.supabase.from("conversation_sessions").select("contact_id").eq("id", ctx.session.id).single();
      if (!session?.contact_id) return { error: "Contact not found" };
      const { data: updated } = await ctx.supabase.from("contacts").update({
        name: params.name ?? void 0,
        phone: params.phone ?? void 0,
        email: params.email ?? void 0,
        notes: params.notes ? `[Update] ${params.notes}` : void 0
      }).eq("id", session.contact_id).select().single();
      return { contact: updated };
    }
  }
});

// tools/impl/non-text.ts
var require_non_text = __commonJS({
  "tools/impl/non-text.ts"(exports, module) {
    "use strict";
    module.exports = { NON_TEXT_TYPES, getNonTextResponse };
    var NON_TEXT_TYPES = ["image", "audio", "document", "sticker", "reaction", "video"];
    function getNonTextResponse() {
      return "I can only read text messages right now. Please type your question!";
    }
  }
});

// guards/credits.ts
var require_credits = __commonJS({
  "guards/credits.ts"(exports, module) {
    "use strict";
    module.exports = { checkCredits };
    async function checkCredits(ctx) {
      const workspace = ctx.workspace;
      if (!workspace?.guardrail_config?.enable_credit_check) return { blocked: false };
      const { data: credits } = await ctx.supabase.rpc("get_workspace_credits", { p_workspace_id: ctx.session.workspace_id });
      if (credits === null || credits === void 0) return { blocked: false };
      if (credits <= 0) {
        return {
          blocked: true,
          reason: "out_of_credits",
          message: workspace.guardrail_config?.out_of_credits_message ?? "Our service is currently unavailable. Please contact the business directly."
        };
      }
      return { blocked: false };
    }
  }
});

// guards/window.ts
var require_window = __commonJS({
  "guards/window.ts"(exports, module) {
    "use strict";
    module.exports = { checkWindow };
    async function checkWindow(ctx) {
      const workspace = ctx.workspace;
      if (!workspace?.guardrail_config?.enable_response_window) return { blocked: false };
      if (ctx.payload.source !== "whatsapp") return { blocked: false };
      const now = Date.now();
      const lastMsg = ctx.session?.last_message_at ? new Date(ctx.session.last_message_at).getTime() : now;
      const windowMs = (workspace.guardrail_config.response_window_hours || 24) * 60 * 60 * 1e3;
      if (now - lastMsg > windowMs) {
        return {
          blocked: true,
          reason: "window_expired",
          message: workspace.guardrail_config?.window_expired_message ?? "Our response window has closed. A human agent will get back to you soon."
        };
      }
      return { blocked: false };
    }
  }
});

// guards/escalation.ts
var require_escalation = __commonJS({
  "guards/escalation.ts"(exports, module) {
    "use strict";
    module.exports = { checkEscalation };
    async function checkEscalation(ctx) {
      const workspace = ctx.workspace;
      if (!workspace?.guardrail_config?.enable_auto_escalation) return { blocked: false };
      const maxTurns = workspace.guardrail_config.max_conversation_turns || 30;
      const turnCount = ctx.session?.turn_count || 0;
      if (turnCount >= maxTurns) {
        return {
          blocked: true,
          reason: "max_turns_exceeded",
          message: workspace.guardrail_config?.escalation_message ?? "I've transferred you to a human agent who can help further."
        };
      }
      return { blocked: false };
    }
  }
});

// guards/blocked-topics.ts
var require_blocked_topics = __commonJS({
  "guards/blocked-topics.ts"(exports, module) {
    "use strict";
    module.exports = { checkBlockedTopics };
    var BLOCKED_KEYWORDS = ["suicide", "self-harm", "illegal drugs", "weapons", "terrorism", "child abuse", "hate speech", "gore", "exploitative"];
    function checkBlockedTopics(text) {
      const lower = text.toLowerCase();
      for (const kw of BLOCKED_KEYWORDS) {
        if (lower.includes(kw)) return { blocked: true, reason: `Message contains blocked topic: ${kw}` };
      }
      return { blocked: false };
    }
  }
});

// guards/greeting.ts
var require_greeting = __commonJS({
  "guards/greeting.ts"(exports, module) {
    "use strict";
    module.exports = { isGreeting };
    var GREETING_PATTERNS = [/^(hey|hi|hello|yo|sup|good\s*(morning|afternoon|evening)|howdy|heya|greetings)[\s!.,]*$/i];
    function isGreeting(text) {
      return GREETING_PATTERNS.some((p) => p.test(text.trim()));
    }
  }
});

// guards/pricing.ts
var require_pricing = __commonJS({
  "guards/pricing.ts"(exports, module) {
    "use strict";
    module.exports = { isPricingQuery };
    var PRICING_KEYWORDS = ["price", "cost", "pricing", "how much", "subscription fee", "plan", "premium", "pro plan", "business plan", "enterprise plan"];
    function isPricingQuery(text) {
      const lower = text.toLowerCase();
      return PRICING_KEYWORDS.some((kw) => lower.includes(kw));
    }
  }
});

// guards/token-budget.ts
var require_token_budget = __commonJS({
  "guards/token-budget.ts"(exports, module) {
    "use strict";
    module.exports = { isOverTokenBudget };
    function isOverTokenBudget(ctx) {
      if (!ctx.session?.total_tokens) return false;
      const maxTokens = ctx.workspace?.guardrail_config?.max_tokens_per_session || 1e5;
      return ctx.session.total_tokens >= maxTokens;
    }
  }
});

// lib/sanitize.ts
var require_sanitize = __commonJS({
  "lib/sanitize.ts"(exports, module) {
    "use strict";
    module.exports = { sanitizeMessage };
    function sanitizeMessage(text) {
      return text.replace(/<[^>]*>/g, "").replace(/\b(https?:\/\/\S+)\b/g, "[URL]").trim().substring(0, 2e3);
    }
  }
});

// lib/tools.ts
var require_tools = __commonJS({
  "lib/tools.ts"(exports, module) {
    "use strict";
    module.exports = {
      getAppointments,
      getContactDetails: getContactDetails2,
      updateContact: updateContact2,
      updateCRMContact,
      createCRMTicket,
      createOrder,
      getOrderStatus,
      searchKnowledgeBase,
      getBusinessHours,
      getGoogleCalendarEvents,
      createGoogleCalendarEvent,
      readGoogleSheet,
      sendWhatsAppText,
      sendWhatsAppImage,
      getAnalytics,
      searchCached,
      agentHandoff,
      sendAppointmentReminders
    };
    var gowaBase = Deno.env.get("GOWA_BASE_URL")?.replace(/\/$/, "") || "";
    var gowaKey = Deno.env.get("GOWA_API_KEY") || "";
    var APP_URL = Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://7flowcore.vercel.app";
    async function getAppointments(ctx, filters = {}) {
      const { data: session } = await ctx.supabase.from("conversation_sessions").select("contact_id").eq("id", ctx.session.id).single();
      if (!session?.contact_id) return [];
      let query = ctx.supabase.from("appointments").select("*").eq("contact_id", session.contact_id).order("created_at", { ascending: false });
      if (filters.status) query = query.eq("status", filters.status);
      if (filters.limit) query = query.limit(filters.limit);
      const { data: appointments } = await query;
      return appointments || [];
    }
    async function getContactDetails2(ctx) {
      const { data: session } = await ctx.supabase.from("conversation_sessions").select("contact_id").eq("id", ctx.session.id).single();
      if (!session?.contact_id) return { error: "Contact not found" };
      const { data: contact } = await ctx.supabase.from("contacts").select("*").eq("id", session.contact_id).single();
      return { contact };
    }
    async function updateContact2(ctx, params) {
      const { data: session } = await ctx.supabase.from("conversation_sessions").select("contact_id").eq("id", ctx.session.id).single();
      if (!session?.contact_id) return { error: "Contact not found" };
      const { data: updated } = await ctx.supabase.from("contacts").update({
        name: params.name ?? void 0,
        phone: params.phone ?? void 0,
        email: params.email ?? void 0
      }).eq("id", session.contact_id).select().single();
      return { contact: updated };
    }
    async function updateCRMContact(ctx, contactId, data2) {
      const { data: updated, error } = await ctx.supabase.from("contacts").update(data2).eq("id", contactId).select().single();
      if (error) return { error: error.message };
      return { contact: updated };
    }
    async function createCRMTicket(ctx, ticket) {
      const { data: newTicket, error } = await ctx.supabase.from("support_tickets").insert({
        workspace_id: ctx.session.workspace_id,
        session_id: ctx.session.id,
        subject: ticket.subject || "Support Request",
        description: ticket.description || "",
        priority: ticket.priority || "medium",
        status: "open"
      }).select().single();
      if (error) return { error: error.message };
      return { ticket: newTicket };
    }
    async function createOrder(ctx, order) {
      const { data: newOrder, error } = await ctx.supabase.from("orders").insert({
        workspace_id: ctx.session.workspace_id,
        session_id: ctx.session.id,
        customer_jid: ctx.payload.customer_jid,
        items: order.items,
        total: order.total,
        currency: order.currency || "INR",
        status: "pending",
        notes: order.notes || ""
      }).select().single();
      if (error) return { error: error.message };
      return { order: newOrder };
    }
    async function getOrderStatus(ctx, orderId) {
      const { data: order, error } = await ctx.supabase.from("orders").select("*").eq("id", orderId).eq("session_id", ctx.session.id).single();
      if (error || !order) return { error: "Order not found" };
      return { order };
    }
    async function searchKnowledgeBase(ctx, query2) {
      try {
        const { data: chunks } = await ctx.supabase.rpc("match_kb_chunks", {
          query_embedding: new Array(384).fill(0),
          match_threshold: 0.5,
          match_count: 5,
          p_workspace_id: ctx.session.workspace_id
        });
        if (!chunks || chunks.length === 0) {
          const { data: fallback } = await ctx.supabase.from("kb_chunks").select("content").eq("workspace_id", ctx.session.workspace_id).limit(5);
          return (fallback || []).map((c) => c.content).join("\n").substring(0, 1e3);
        }
        return chunks.map((c) => c.content).join("\n").substring(0, 1e3);
      } catch {
        return "";
      }
    }
    async function getBusinessHours(ctx) {
      return ctx.workspace?.business_hours?.schedules || [];
    }
    async function getGoogleCalendarEvents(ctx, timeMin, timeMax) {
      return [];
    }
    async function createGoogleCalendarEvent(ctx, event) {
      return { error: "Google Calendar not configured" };
    }
    async function readGoogleSheet(ctx, sheetId, range) {
      return { error: "Google Sheets not configured" };
    }
    async function sendWhatsAppText(ctx, to, message) {
      if (ctx.payload.source !== "whatsapp") return;
      const phone = to.split("@")[0];
      const { data: gs } = await ctx.supabase.from("gowa_sessions").select("gowa_session_id").eq("workspace_id", ctx.session.workspace_id).maybeSingle();
      if (!gs?.gowa_session_id) return;
      try {
        await fetch(`${gowaBase}/send/message`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${btoa(gowaKey)}`,
            "Content-Type": "application/json",
            "X-Device-Id": gs.gowa_session_id
          },
          body: JSON.stringify({ phone, message })
        });
      } catch {
      }
    }
    async function sendWhatsAppImage(ctx, to, imageUrl, caption) {
      if (ctx.payload.source !== "whatsapp") return;
      const phone = to.split("@")[0];
      const { data: gs } = await ctx.supabase.from("gowa_sessions").select("gowa_session_id").eq("workspace_id", ctx.session.workspace_id).maybeSingle();
      if (!gs?.gowa_session_id) return;
      try {
        await fetch(`${gowaBase}/send/image`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${btoa(gowaKey)}`,
            "Content-Type": "application/json",
            "X-Device-Id": gs.gowa_session_id
          },
          body: JSON.stringify({ phone, image: imageUrl, caption: caption || "" })
        });
      } catch {
      }
    }
    async function getAnalytics(ctx) {
      return [];
    }
    async function searchCached(ctx, query2) {
      return null;
    }
    async function agentHandoff(ctx, reason) {
      return { handled: true, response: reason || "Transferring to a human agent..." };
    }
    async function sendAppointmentReminders(ctx) {
    }
  }
});

// lib/llm.ts
var require_llm = __commonJS({
  "lib/llm.ts"(exports, module) {
    "use strict";
    module.exports = { callGroq, callGroqStream };
    var GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") || "";
    var GROQ_MODEL = "llama-3.3-70b-versatile";
    var GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
    async function callGroq(messages, options = {}) {
      const response = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: options.model || GROQ_MODEL,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 1024,
          stream: false
        })
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq API error ${response.status}: ${errText}`);
      }
      const data2 = await response.json();
      return data2.choices?.[0]?.message?.content || "";
    }
    async function callGroqStream(messages, options = {}) {
      const response = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: options.model || GROQ_MODEL,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 1024,
          stream: true
        })
      });
      return response.body;
    }
  }
});

// lib/session.ts
var require_session = __commonJS({
  "lib/session.ts"(exports, module) {
    "use strict";
    module.exports = { getOrCreateSession, touchSession };
    async function getOrCreateSession(supabase, params) {
      const { data: existing } = await supabase.from("conversation_sessions").select("*, workspaces!inner(name, guardrail_config, business_hours, timezone)").eq("customer_jid", params.customer_jid).eq("workspace_id", params.workspace_id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (existing) return existing;
      const { data: workspace } = await supabase.from("workspaces").select("*").eq("id", params.workspace_id).single();
      if (!workspace) throw new Error("Workspace not found");
      const { data: newSession } = await supabase.from("conversation_sessions").insert({
        workspace_id: params.workspace_id,
        customer_jid: params.customer_jid,
        channel: params.channel,
        agent_type: params.agent_type || "customer_support",
        status: "active",
        turn_count: 0,
        total_tokens: 0
      }).select("*, workspaces!inner(name, guardrail_config, business_hours, timezone)").single();
      return newSession;
    }
    async function touchSession(ctx, agentType, lastResponse) {
      const update = {
        last_message_at: new Date().toISOString(),
        agent_type: agentType,
        turn_count: (ctx.session?.turn_count || 0) + 1
      };
      if (lastResponse && ctx.session) {
        update.last_assistant_message = lastResponse;
      }
      await ctx.supabase.from("conversation_sessions").update(update).eq("id", ctx.session?.id || "").maybeSingle();
    }
  }
});

// tools/registry.ts
var require_registry = __commonJS({
  "tools/registry.ts"(exports, module) {
    "use strict";
    module.exports = { getToolDefinitions, AGENT_DESCRIPTIONS };
    var AGENT_DESCRIPTIONS = {
      booking: "Handles appointment scheduling, rescheduling, and cancellations. Use this for any booking-related queries.",
      sales: "Handles product inquiries, pricing, orders, and payment questions. Use this for sales-related queries.",
      support: "Handles technical support, troubleshooting, account issues, and general assistance. Use this for support queries."
    };
    function getToolDefinitions() {
      return [
        {
          name: "get_appointments",
          description: "Retrieve appointments for the current contact, optionally filtered by status",
          parameters: {
            type: "object",
            properties: {
              status: { type: "string", enum: ["scheduled", "completed", "cancelled", "no_show"], description: "Filter by status" },
              limit: { type: "number", description: "Max number of appointments to return" }
            }
          }
        },
        {
          name: "get_contact_details",
          description: "Get details of the current contact",
          parameters: { type: "object", properties: {} }
        },
        {
          name: "update_contact",
          description: "Update contact information",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Contact name" },
              phone: { type: "string", description: "Phone number" },
              email: { type: "string", description: "Email address" },
              notes: { type: "string", description: "Additional notes" }
            }
          }
        },
        {
          name: "search_knowledge_base",
          description: "Search the knowledge base for relevant information",
          parameters: {
            type: "object",
            properties: { query: { type: "string", description: "Search query" } },
            required: ["query"]
          }
        },
        {
          name: "get_business_hours",
          description: "Get business hours for the current workspace",
          parameters: { type: "object", properties: {} }
        },
        {
          name: "create_support_ticket",
          description: "Create a support ticket for escalation",
          parameters: {
            type: "object",
            properties: {
              subject: { type: "string", description: "Ticket subject" },
              description: { type: "string", description: "Detailed description" },
              priority: { type: "string", enum: ["low", "medium", "high", "urgent"], description: "Priority level" }
            },
            required: ["subject", "description"]
          }
        },
        {
          name: "agent_handoff",
          description: "Transfer conversation to a human agent",
          parameters: {
            type: "object",
            properties: { reason: { type: "string", description: "Reason for handoff" } },
            required: ["reason"]
          }
        },
        {
          name: "create_order",
          description: "Create a new order",
          parameters: {
            type: "object",
            properties: {
              items: { type: "array", items: { type: "object", properties: { name: { type: "string" }, quantity: { type: "number" }, price: { type: "number" } } }, description: "Order items" },
              total: { type: "number", description: "Total amount" },
              currency: { type: "string", description: "Currency code" },
              notes: { type: "string", description: "Order notes" }
            },
            required: ["items", "total"]
          }
        },
        {
          name: "get_order_status",
          description: "Check status of an existing order",
          parameters: {
            type: "object",
            properties: { order_id: { type: "string", description: "Order ID" } },
            required: ["order_id"]
          }
        }
      ];
    }
  }
});

// lib/types.ts
var require_types = __commonJS({
  "lib/types.ts"(exports, module) {
    "use strict";
    __export(exports, {
      ToolCall: void 0,
      ToolResult: void 0
    });
  }
});

// pipeline/t0-instant.ts
var require_t0_instant = __commonJS({
  "pipeline/t0-instant.ts"(exports, module) {
    "use strict";
    module.exports = { runT0 };
    async function runT0(ctx) {
      const text = ctx.payload.message || "";
      if (!text) return { handled: false };
      const greetingCheck = require_greeting().isGreeting(text);
      if (greetingCheck) {
        const name = ctx.session?.workspaces?.name || ctx.workspace?.name || "there";
        return { handled: true, reason: "greeting", response: `Hey ${name}! How can I help you today?` };
      }
      const blockedCheck = require_blocked_topics().checkBlockedTopics(text);
      if (blockedCheck.blocked) {
        return { handled: true, reason: "blocked_topic", response: "I'm sorry, I can't discuss this topic. Let me redirect you to something else." };
      }
      const nonText = require_non_text().getNonTextResponse();
      if (nonText) {
        const msgType = ctx.payload.message_type;
        if (require_non_text().NON_TEXT_TYPES.includes(msgType)) {
          return { handled: true, reason: "non_text_message", response: nonText };
        }
      }
      return { handled: false };
    }
  }
});

// pipeline/t1-cache.ts
var require_t1_cache = __commonJS({
  "pipeline/t1-cache.ts"(exports, module) {
    "use strict";
    module.exports = { runT1 };
    async function runT1(ctx) {
      const credits2 = require_credits().checkCredits(ctx);
      if ((await credits2).blocked) {
        return { handled: true, reason: (await credits2).reason, response: (await credits2).message };
      }
      const window2 = require_window().checkWindow(ctx);
      if ((await window2).blocked) {
        return { handled: true, reason: (await window2).reason, response: (await window2).message };
      }
      const escalation = require_escalation().checkEscalation(ctx);
      if ((await escalation).blocked) {
        return { handled: true, reason: (await escalation).reason, response: (await escalation).message };
      }
      return { handled: false };
    }
  }
});

// agents/sales.ts
var require_sales = __commonJS({
  "agents/sales.ts"(exports, module) {
    "use strict";
    module.exports = { SALES_SYSTEM_PROMPT_HEADER, SALES_TOOL_DESCRIPTIONS };
    var SALES_SYSTEM_PROMPT_HEADER = `You are a helpful sales assistant. Your goal is to help customers find what they need, answer product questions, and process orders.

Key Responsibilities:
- Answer product and service questions
- Provide pricing information
- Help customers place orders
- Check order status
- Provide business hours
- Transfer to human agent when needed`;
    var SALES_TOOL_DESCRIPTIONS = "Available tools: get_business_hours, create_order, get_order_status, search_knowledge_base, agent_handoff";
  }
});

// agents/support.ts
var require_support = __commonJS({
  "agents/support.ts"(exports, module) {
    "use strict";
    module.exports = { SUPPORT_SYSTEM_PROMPT_HEADER, SUPPORT_TOOL_DESCRIPTIONS };
    var SUPPORT_SYSTEM_PROMPT_HEADER = `You are a technical support assistant. Your goal is to help customers troubleshoot issues and resolve their problems.

Key Responsibilities:
- Troubleshoot technical issues
- Guide customers through solutions
- Create support tickets for complex issues
- Search knowledge base for solutions
- Transfer to human agent when needed`;
    var SUPPORT_TOOL_DESCRIPTIONS = "Available tools: search_knowledge_base, create_support_ticket, get_business_hours, agent_handoff";
  }
});

// agents/booking.ts
var require_booking = __commonJS({
  "agents/booking.ts"(exports, module) {
    "use strict";
    module.exports = { BOOKING_SYSTEM_PROMPT };
    var BOOKING_SYSTEM_PROMPT = `You are a booking assistant. Your goal is to help customers schedule, reschedule, or cancel appointments.

Key Responsibilities:
- Check available appointment slots
- Schedule new appointments
- Reschedule existing appointments
- Cancel appointments
- Send appointment reminders
- Transfer to human agent when needed`;
  }
});

// lib/hf-embeddings.ts
var require_hf_embeddings = __commonJS({
  "lib/hf-embeddings.ts"(exports, module) {
    "use strict";
    module.exports = { generateEmbedding };
    async function generateEmbedding(text) {
      return new Array(384).fill(0);
    }
  }
});

// tools/executor.ts
var require_executor = __commonJS({
  "tools/executor.ts"(exports, module) {
    "use strict";
    module.exports = { executeToolCall, executeToolCalls };
    async function executeToolCall(ctx, call) {
      const name = call.name;
      const args = call.arguments || {};
      const tools2 = require_tools();
      switch (name) {
        case "get_appointments": {
          const result = await tools2.getAppointments(ctx, args);
          return JSON.stringify(result);
        }
        case "get_contact_details": {
          const result = await tools2.getContactDetails(ctx);
          return JSON.stringify(result);
        }
        case "update_contact": {
          const result = await tools2.updateContact(ctx, args);
          return JSON.stringify(result);
        }
        case "search_knowledge_base": {
          const result = await tools2.searchKnowledgeBase(ctx, args.query);
          return result || "No relevant information found.";
        }
        case "get_business_hours": {
          const result = await tools2.getBusinessHours(ctx);
          return JSON.stringify(result);
        }
        case "create_support_ticket": {
          const result = await tools2.createCRMTicket(ctx, args);
          return JSON.stringify(result);
        }
        case "create_order": {
          const result = await tools2.createOrder(ctx, args);
          return JSON.stringify(result);
        }
        case "get_order_status": {
          const result = await tools2.getOrderStatus(ctx, args.order_id);
          return JSON.stringify(result);
        }
        case "agent_handoff": {
          const result = await tools2.agentHandoff(ctx, args.reason);
          return JSON.stringify(result);
        }
        case "send_email": {
          return JSON.stringify({ error: "Email tool not implemented" });
        }
        default:
          return JSON.stringify({ error: `Unknown tool: ${name}` });
      }
    }
    async function executeToolCalls(ctx, calls) {
      const results = [];
      for (const call of calls) {
        const result = await executeToolCall(ctx, call);
        results.push({ call: call.name, result });
      }
      return results;
    }
  }
});

// tools/impl/support-ticket.ts
var require_support_ticket = __commonJS({
  "tools/impl/support-ticket.ts"(exports, module) {
    "use strict";
    module.exports = { createSupportTicket };
    async function createSupportTicket(ctx, subject, description, priority = "medium") {
      const { data: ticket, error } = await ctx.supabase.from("support_tickets").insert({
        workspace_id: ctx.session.workspace_id,
        session_id: ctx.session.id,
        subject,
        description,
        priority,
        status: "open"
      }).select().single();
      if (error) return { error: error.message };
      return { ticket };
    }
  }
});

// tools/impl/kb.ts
var require_kb = __commonJS({
  "tools/impl/kb.ts"(exports, module) {
    "use strict";
    module.exports = { searchKB };
    async function searchKB(ctx, query2) {
      try {
        const { data: chunks } = await ctx.supabase.rpc("match_kb_chunks", {
          query_embedding: new Array(384).fill(0),
          match_threshold: 0.5,
          match_count: 5,
          p_workspace_id: ctx.session.workspace_id
        });
        if (!chunks || chunks.length === 0) {
          const { data: fallback } = await ctx.supabase.from("kb_chunks").select("content").eq("workspace_id", ctx.session.workspace_id).limit(5);
          return (fallback || []).map((c) => c.content).join("\n").substring(0, 1e3);
        }
        return chunks.map((c) => c.content).join("\n").substring(0, 1e3);
      } catch {
        return "";
      }
    }
  }
});

// tools/impl/google.ts
var require_google = __commonJS({
  "tools/impl/google.ts"(exports, module) {
    "use strict";
    module.exports = {
      queryGoogleCalendar,
      createGoogleEvent,
      readGoogleSheet2
    };
    async function queryGoogleCalendar(ctx, timeMin, timeMax) {
      return [];
    }
    async function createGoogleEvent(ctx, event) {
      return { error: "Google Calendar not configured" };
    }
    async function readGoogleSheet2(ctx, spreadsheetId, range) {
      return { error: "Google Sheets not configured" };
    }
  }
});

// tools/impl/crm.ts
var require_crm = __commonJS({
  "tools/impl/crm.ts"(exports, module) {
    "use strict";
    module.exports = { updateCRMTicket, getCRMTickets };
    async function updateCRMTicket(ctx, ticketId, updates) {
      const { data: ticket, error } = await ctx.supabase.from("support_tickets").update(updates).eq("id", ticketId).select().single();
      if (error) return { error: error.message };
      return { ticket };
    }
    async function getCRMTickets(ctx, filters = {}) {
      let query = ctx.supabase.from("support_tickets").select("*").eq("workspace_id", ctx.session.workspace_id);
      if (filters.status) query = query.eq("status", filters.status);
      if (filters.priority) query = query.eq("priority", filters.priority);
      if (filters.limit) query = query.limit(filters.limit);
      const { data: tickets } = await query.order("created_at", { ascending: false });
      return tickets || [];
    }
  }
});

// tools/impl/order.ts
var require_order = __commonJS({
  "tools/impl/order.ts"(exports, module) {
    "use strict";
    module.exports = { createOrder2, getOrderStatus2 };
    var APP_URL2 = Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://7flowcore.vercel.app";
    async function createOrder2(ctx, items, total, currency = "INR", notes = "") {
      const { data: order, error } = await ctx.supabase.from("orders").insert({
        workspace_id: ctx.session.workspace_id,
        session_id: ctx.session.id,
        customer_jid: ctx.payload.customer_jid,
        items,
        total,
        currency,
        status: "pending",
        notes
      }).select().single();
      if (error) return { error: error.message };
      return { order };
    }
    async function getOrderStatus2(ctx, orderId) {
      const { data: order, error } = await ctx.supabase.from("orders").select("*").eq("id", orderId).eq("session_id", ctx.session.id).single();
      if (error || !order) return { error: "Order not found" };
      return { order };
    }
  }
});

// tools/impl/calendar.ts
var require_calendar = __commonJS({
  "tools/impl/calendar.ts"(exports, module) {
    "use strict";
    module.exports = {
      createAppointment,
      rescheduleAppointment,
      cancelAppointment,
      getAppointmentsForContact,
      getAvailableSlots,
      sendAppointmentNotifications
    };
    async function createAppointment(ctx, contactId, slot, durationMin = 30) {
      if (!contactId) {
        const { data: session } = await ctx.supabase.from("conversation_sessions").select("contact_id").eq("id", ctx.session.id).single();
        if (session?.contact_id) contactId = session.contact_id;
      }
      const { data: appointment, error } = await ctx.supabase.from("appointments").insert({
        workspace_id: ctx.session.workspace_id,
        contact_id: contactId || null,
        session_id: ctx.session.id,
        start_time: slot,
        duration_minutes: durationMin,
        status: "scheduled"
      }).select().single();
      if (error) return { error: error.message };
      EdgeRuntime.waitUntil(sendAppointmentNotifications(ctx, appointment, null));
      return { appointment };
    }
    async function rescheduleAppointment(ctx, appointmentId, newSlot) {
      const { data: appointment, error } = await ctx.supabase.from("appointments").update({
        start_time: newSlot,
        status: "scheduled"
      }).eq("id", appointmentId).eq("workspace_id", ctx.session.workspace_id).select().single();
      if (error) return { error: error.message };
      EdgeRuntime.waitUntil(sendAppointmentNotifications(ctx, appointment, newSlot));
      return { appointment };
    }
    async function cancelAppointment(ctx, appointmentId) {
      const { data: appointment, error } = await ctx.supabase.from("appointments").update({
        status: "cancelled"
      }).eq("id", appointmentId).eq("workspace_id", ctx.session.workspace_id).select().single();
      if (error) return { error: error.message };
      return { appointment };
    }
    async function getAppointmentsForContact(ctx, contactId) {
      if (!contactId) {
        const { data: session } = await ctx.supabase.from("conversation_sessions").select("contact_id").eq("id", ctx.session.id).single();
        if (session?.contact_id) contactId = session.contact_id;
      }
      if (!contactId) return [];
      const { data: byContact } = await ctx.supabase.from("appointments").select("*").eq("contact_id", contactId).order("created_at", { ascending: false });
      const { data: bySession } = await ctx.supabase.from("appointments").select("*").eq("session_id", ctx.session.id).order("created_at", { ascending: false });
      return [...(byContact || []), ...(bySession || [])];
    }
    async function getAvailableSlots(ctx, date) {
      return [
        { start: `${date}T09:00:00`, end: `${date}T09:30:00` },
        { start: `${date}T09:30:00`, end: `${date}T10:00:00` },
        { start: `${date}T10:00:00`, end: `${date}T10:30:00` },
        { start: `${date}T10:30:00`, end: `${date}T11:00:00` }
      ];
    }
    async function sendAppointmentNotifications(ctx, appointment, meetLink) {
      try {
        const workspace = ctx.workspace;
        if (!workspace) return;
        if (!workspace.name) return;
        const phone = ctx.payload.customer_jid?.split("@")[0];
        if (!phone) return;
        const gowaApiKey = Deno.env.get("GOWA_API_KEY") || "";
        const gowaBase2 = Deno.env.get("GOWA_BASE_URL")?.replace(/\/$/, "") || "";
        const { data: gs } = await ctx.supabase.from("gowa_sessions").select("gowa_session_id").eq("workspace_id", ctx.session.workspace_id).maybeSingle();
        if (!gs?.gowa_session_id) return;
        const timeStr = new Date(appointment.start_time).toLocaleString("en-IN", { timeZone: workspace.timezone || "Asia/Kolkata" });
        let message = `Appointment Confirmation

Workspace: ${workspace.name}
Time: ${timeStr}
Duration: ${appointment.duration_minutes || 30} minutes`;
        if (meetLink) message += `
Meeting Link: ${meetLink}`;
        await fetch(`${gowaBase2}/send/message`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${btoa(gowaApiKey)}`,
            "Content-Type": "application/json",
            "X-Device-Id": gs.gowa_session_id
          },
          body: JSON.stringify({ phone, message })
        });
      } catch {
      }
    }
  }
});

// tools/impl/handoff.ts
var require_handoff = __commonJS({
  "tools/impl/handoff.ts"(exports, module) {
    "use strict";
    module.exports = { transferToHuman };
    async function transferToHuman(ctx, reason) {
      await ctx.supabase.from("escalation_logs").insert({
        workspace_id: ctx.session.workspace_id,
        session_id: ctx.session.id,
        reason: reason || "Customer requested",
        status: "pending"
      });
      return {
        handled: true,
        response: "I've transferred you to a human agent who will assist you shortly."
      };
    }
  }
});

// lib/dispatch.ts
var require_dispatch = __commonJS({
  "lib/dispatch.ts"(exports, module) {
    "use strict";
    module.exports = { dispatch };
    async function dispatch(ctx, text) {
      if (ctx.payload.source === "whatsapp") {
        const tools2 = require_tools();
        const phone = ctx.payload.customer_jid?.split("@")[0];
        if (phone) {
          await tools2.sendWhatsAppText(ctx, ctx.payload.customer_jid, text);
        }
        return;
      }
      if (ctx.payload.source === "webchat" || ctx.payload.source === "api") {
        await ctx.supabase.from("messages").insert({
          session_id: ctx.session.id,
          workspace_id: ctx.session.workspace_id,
          content: text,
          role: "assistant",
          source: ctx.payload.source
        });
        return;
      }
      console.log(`[DISPATCH] Unhandled source: ${ctx.payload.source}, message: ${text.substring(0, 100)}`);
    }
  }
});

// pipeline/t2-router.ts
var require_t2_router = __commonJS({
  "pipeline/t2-router.ts"(exports, module) {
    "use strict";
    module.exports = { runT2 };
    var AGENT_MAP = {
      booking: ["appointment", "booking", "schedule", "reschedule", "cancel my", "book a"],
      sales: ["price", "cost", "buy", "order", "product", "pricing", "how much", "purchase"],
      support: ["help", "issue", "problem", "error", "bug", "not working", "broken", "fix"]
    };
    async function runT2(ctx) {
      const text = ctx.payload.message || "";
      const lower = text.toLowerCase();
      for (const [agent, keywords] of Object.entries(AGENT_MAP)) {
        if (keywords.some((kw) => lower.includes(kw))) {
          ctx.agentType = agent;
          return { handled: false, reason: `routed_to_${agent}` };
        }
      }
      ctx.agentType = "customer_support";
      return { handled: false, reason: "routed_to_customer_support" };
    }
  }
});

// pipeline/t3-planner.ts
var require_t3_planner = __commonJS({
  "pipeline/t3-planner.ts"(exports, module) {
    "use strict";
    module.exports = { runT3 };
    var GROQ_MODEL2 = Deno.env.get("GROQ_MODEL") || "llama-3.3-70b-versatile";
    async function runT3(ctx) {
      const llm = require_llm();
      const tools2 = require_tools();
      const registry = require_registry();
      const agentType = ctx.agentType || "customer_support";
      const toolDefs = registry.getToolDefinitions();
      let systemPrompt = buildSystemPrompt(ctx, agentType, toolDefs);
      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: ctx.payload.message || "" }
      ];
      try {
        const response = await llm.callGroq(messages, { temperature: 0.3, maxTokens: 2048 });
        const parsed = parseResponse(response, toolDefs);
        if (parsed.toolCalls && parsed.toolCalls.length > 0) {
          const executor = require_executor();
          const toolResults = await executor.executeToolCalls(ctx, parsed.toolCalls);
          let toolContext = "Tool Results:\n" + toolResults.map((r) => `${r.call}: ${r.result}`).join("\n");
          messages.push({ role: "assistant", content: response });
          messages.push({ role: "user", content: toolContext });
          const finalResponse = await llm.callGroq(messages, { temperature: 0.3, maxTokens: 1024 });
          return { handled: true, reason: "t3_planned", response: finalResponse };
        }
        return { handled: true, reason: "t3_direct", response };
      } catch (err) {
        console.error("[T3] LLM error:", err);
        return { handled: true, reason: "t3_fallback", response: fallbackResponse(ctx) };
      }
    }
    function buildSystemPrompt(ctx, agentType, toolDefs) {
      const workspace2 = ctx.workspace;
      const name = workspace2?.name || "Business";
      const hours = workspace2?.business_hours?.schedules;
      const hoursStr = hours ? JSON.stringify(hours) : "Not configured";
      const parts = [
        `You are a helpful AI assistant for ${name}.`,
        `Business Hours: ${hoursStr}`,
        ``,
        `When responding to the user:`,
        `1. Be concise and friendly`,
        `2. Use the available tools when needed`,
        `3. If you cannot help, offer to transfer to a human agent`,
        `4. Always confirm before making changes`,
        ``,
        `Available tools: ${JSON.stringify(toolDefs)}`,
        ``,
        `IMPORTANT: Respond in plain text. Do NOT use markdown formatting.`
      ];
      if (agentType === "booking") {
        parts.unshift(require_booking().BOOKING_SYSTEM_PROMPT);
      } else if (agentType === "sales") {
        parts.unshift(require_sales().SALES_SYSTEM_PROMPT_HEADER);
      } else if (agentType === "support") {
        parts.unshift(require_support().SUPPORT_SYSTEM_PROMPT_HEADER);
      }
      return parts.join("\n");
    }
    function parseResponse(response, toolDefs) {
      try {
        const parsed = JSON.parse(response);
        if (parsed.tool) {
          return { toolCalls: [{ name: parsed.tool, arguments: parsed.parameters || {} }] };
        }
        if (parsed.tool_calls) {
          return { toolCalls: parsed.tool_calls };
        }
      } catch {
      }
      return { toolCalls: [] };
    }
    function fallbackResponse(ctx) {
      const name2 = ctx.workspace?.name || "the team";
      return `Thanks for your message! I'm having trouble processing your request right now. Let me transfer you to a human agent from ${name2} who can help.`;
    }
  }
});

// index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

var responseHeaders = {
  "Content-Type": "application/json",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff"
};
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 204 });
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const internalSecret = Deno.env.get("INTERNAL_CRON_SECRET") || "";
    const legacyKey = Deno.env.get("SERVICE_KEY") || "";
    if (!token || token !== serviceRoleKey && token !== internalSecret && token !== legacyKey) {
      console.error("[ORCHESTRATOR] Unauthorized invocation attempt");
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: responseHeaders });
    }
    const payload = await parseWebhook(req);
    if (!payload) return new Response("ok", { status: 200 });
    await processMessage(payload);
    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error("[ORCHESTRATOR] Parse error:", e.message);
    return new Response(JSON.stringify({ error: e.message }), { status: 200, headers: responseHeaders });
  }
});
async function processMessage(payload) {
  const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
  try {
    const session = await require_session().getOrCreateSession(supabase, {
      workspace_id: payload.workspace_id,
      customer_jid: payload.customer_jid,
      channel: payload.source,
      agent_type: "customer_support"
    });
    const ctx = { supabase, session, payload };
    const guardrailConfig = session.workspaces?.guardrail_config || {};
    ctx.workspace = session.workspaces;
    console.log(`[ORCHESTRATOR] Processing message for workspace: ${ctx.workspace?.name}`);
    const t0 = await require_t0_instant().runT0(ctx);
    if (t0.handled) {
      console.log(`[ORCHESTRATOR] T0 handled: ${t0.reason}`);
      await require_session().touchSession(ctx, "customer_support", t0.response || "");
      return require_dispatch().dispatch(ctx, t0.response);
    }
    const t1 = await require_t1_cache().runT1(ctx);
    if (t1.handled) {
      console.log(`[ORCHESTRATOR] T1 handled: ${t1.reason}`);
      await require_session().touchSession(ctx, "customer_support", t1.response || "");
      return require_dispatch().dispatch(ctx, t1.response);
    }
    const t2 = await require_t2_router().runT2(ctx);
    if (t2.handled) {
      console.log(`[ORCHESTRATOR] T2 handled: ${t2.reason}`);
      await require_session().touchSession(ctx, ctx.agentType || "customer_support", t2.response || "");
      return require_dispatch().dispatch(ctx, t2.response);
    }
    console.log(`[ORCHESTRATOR] Entering T3 Planner for agent: ${ctx.agentType}`);
    const t3 = await require_t3_planner().runT3(ctx);
    console.log(`[ORCHESTRATOR] T3 completed: ${t3.reason}`);
    await require_dispatch().dispatch(ctx, t3.response);
  } catch (e) {
    console.error("[ORCHESTRATOR] Error:", e.message);
    await dispatchFallback(supabase, payload);
  }
}
async function parseWebhook(req) {
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return null;
  const contentLength = parseInt(req.headers.get("content-length") || "0", 10);
  if (contentLength > 1e6) return null;
  const body = await req.json();
  if (!body.workspace_id) return null;
  body.message = body.message ?? "";
  body.message_type = body.message_type ?? "text";
  return {
    workspace_id: body.workspace_id,
    customer_jid: body.customer_jid || crypto.randomUUID(),
    customer_phone: body.customer_jid?.split("@")[0] || "",
    message: body.message,
    message_type: body.message_type || "text",
    gowa_message_id: body.gowa_message_id || crypto.randomUUID(),
    timestamp: body.timestamp || Date.now(),
    source: body.channel || body.source || "whatsapp",
    is_test: body.is_test || false
  };
}
async function dispatchFallback(supabase, payload) {
  const gowaBase2 = Deno.env.get("GOWA_BASE_URL")?.replace(/\/$/, "");
  const gowaKey2 = Deno.env.get("GOWA_API_KEY");
  if (!gowaBase2 || !gowaKey2 || payload.source !== "whatsapp") return;
  const phone = payload.customer_jid?.split("@")[0];
  if (!phone) return;
  const { data: gs } = await supabase.from("gowa_sessions").select("gowa_session_id").eq("workspace_id", payload.workspace_id).maybeSingle();
  if (!gs?.gowa_session_id) return;
  const msg = "I'm having a small technical hiccup right now! Our team has been notified and will get back to you very shortly.";
  await fetch(`${gowaBase2}/send/message`, {
    method: "POST",
    headers: { Authorization: `Basic ${btoa(gowaKey2)}`, "Content-Type": "application/json", "X-Device-Id": gs.gowa_session_id },
    body: JSON.stringify({ phone, message: msg })
  }).catch(() => {
  });
}
