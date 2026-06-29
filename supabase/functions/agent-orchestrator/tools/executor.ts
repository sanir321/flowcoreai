import { PipelineContext } from "../lib/types.ts";
import { matchChunks } from "./impl/kb.ts";
import { checkAvailability, createAppointment, updateAppointment, cancelAppointment } from "./impl/calendar.ts";
import { getHistory, update } from "./impl/contact.ts";
import { captureLead, updateLeadStage, getPipeline, scheduleFollowUp } from "./impl/crm.ts";
import { searchMenu, sendMenuMedia, checkStock, sendCatalog, placeOrder } from "./impl/order.ts";
import { requestHandoff } from "./impl/handoff.ts";
import { createTicket, getTicketStatus } from "./impl/support-ticket.ts";
import { getBusinessProfile } from "./impl/business-profile.ts";

const PER_TOOL_TIMEOUTS: Record<string, number> = {
  search_kb: 3000,
  manage_contact: 5000,
  get_business_info: 5000,
  manage_appointment: 10000,
  manage_catalog: 8000,
  place_order: 12000,
  transfer_agent: 5000,
  escalate: 10000,
};

const TOOL_RATE_LIMITS: Record<string, number> = {
  manage_appointment: 5,
  search_kb: 10,
  manage_catalog: 10,
  manage_contact: 10,
  get_business_info: 10,
  place_order: 5,
  escalate: 3,
  transfer_agent: 5,
};

const countCache = new WeakMap<PipelineContext, Record<string, number>>();

function stripPII(args: Record<string, unknown>): Record<string, unknown> {
  const str = JSON.stringify(args);
  const cleaned = str
    .replace(/[\w.-]+@[\w.-]+\.\w+/g, "[REDACTED]")
    .replace(/\b\d{10,}\b/g, "[REDACTED]");
  try { return JSON.parse(cleaned); } catch { return args; }
}

function normalizeToolName(name: string): string {
  return name.replace(/^(functions\.|tool_calls\[|tools\.)/, "");
}

export const toolExecutor = {
  async run(toolName: string, params: Record<string, unknown>, ctx: PipelineContext): Promise<any> {
    toolName = normalizeToolName(toolName);
    const startTime = Date.now();

    // Session-level idempotency guard for manage_appointment create
    if (toolName === "manage_appointment" && params.action === "create") {
      if (!ctx._appointmentCreated) {
        ctx._appointmentCreated = true;
      } else {
        // Already created an appointment in this request cycle
        return {
          success: true,
          already_booked: true,
          note: "Appointment already created in this session."
        };
      }
    }

    // Session-level idempotency guard for place_order
    if (toolName === "place_order") {
      if (ctx._orderPlaced) {
        return {
          success: true,
          already_placed: true,
          note: "Order already placed in this session."
        };
      }
      ctx._orderPlaced = true;
    }

    // Widget is strictly customer support only - no transfers
    if (toolName === "transfer_agent" && ctx.payload.source === "widget") {
      return { error: "Transfers are not available through the web widget." };
    }

    // Session-level guard for transfer_agent - prevent duplicate escalations
    if (toolName === "transfer_agent") {
      if (ctx._transferAgentCalled) {
        return { 
          success: true, 
          handoff_to: params.target_agent, 
          note: "Already transferred in this session." 
        };
      }
      ctx._transferAgentCalled = true;
    }

    const limit = TOOL_RATE_LIMITS[toolName] ?? 20;
    if (limit > 0) {
      let counts = countCache.get(ctx);
      if (!counts) {
        const { data } = await ctx.supabase
          .from("tool_call_logs")
          .select("tool_name")
          .eq("session_id", ctx.session.id)
          .gte("created_at", new Date(Date.now() - 3600000).toISOString());
        counts = {};
        data?.forEach((row: any) => {
          counts![row.tool_name] = (counts![row.tool_name] || 0) + 1;
        });
        countCache.set(ctx, counts!);
      }

      const count = counts[toolName] || 0;
      if (count >= limit) {
        return { success: false, error: `Rate limit exceeded for ${toolName} (max ${limit}/hour)` };
      }
    }

    const timeout = PER_TOOL_TIMEOUTS[toolName] ?? 10000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    let result: any;
    try {
      result = await Promise.race([
        routeToImpl(toolName, params, ctx),
        new Promise<never>((_, reject) => {
          const t = setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout);
          controller.signal.addEventListener("abort", () => {
            clearTimeout(t);
            reject(new Error(`Timeout after ${timeout}ms`));
          });
        })
      ]);
    } catch (error: any) {
      console.error(`[ToolExecutor] ${toolName} error:`, error.message);
      result = { success: false, error: error.message || "Tool execution failed" };
    } finally {
      clearTimeout(timer);
    }

    const durationMs = Date.now() - startTime;

    if (ctx.payload.is_test) {
      if (!ctx._toolCalls) ctx._toolCalls = [];
      ctx._toolCalls.push({
        tool: toolName,
        params,
        success: !result.error,
        result: result.error ? result.error : result,
        duration_ms: durationMs,
      });
    }

    if (!ctx._toolCallBuffer) ctx._toolCallBuffer = [];
    ctx._toolCallBuffer.push({
      session_id: ctx.session.id,
      workspace_id: ctx.payload.workspace_id,
      tool_name: toolName,
      args: stripPII(params as Record<string, unknown>),
      result: result?.data || result,
      error: result?.error,
      success: !result?.error,
      duration_ms: durationMs
    });

    if (!ctx._toolFailCounts) ctx._toolFailCounts = {};
    ctx._toolFailCounts[toolName] = (ctx._toolFailCounts[toolName] || 0) + (result?.error ? 1 : 0);

    return result;
  },

  async flushToolCalls(ctx: PipelineContext) {
    if (!ctx._toolCallBuffer || ctx._toolCallBuffer.length === 0) return;
    const buffer = ctx._toolCallBuffer;
    ctx._toolCallBuffer = [];
    try {
      await ctx.supabase.from("tool_call_logs").insert(buffer);
    } catch (e: any) {
      console.error("[ToolExecutor] Flush failed:", e.message);
    }
  }
};

async function routeToImpl(toolName: string, params: any, ctx: PipelineContext): Promise<any> {
  const action = params.action || "";

  switch (toolName) {
    case "search_kb":
      return matchChunks({ query: params.query }, ctx);

    case "manage_appointment": {
      switch (action) {
        case "check": return checkAvailability({ date: params.date, time: params.time }, ctx);
        case "create": return createAppointment(params, ctx);
        case "update": return updateAppointment(params, ctx);
        case "cancel": return cancelAppointment(params, ctx);
        default: return { success: false, error: `Unknown manage_appointment action: ${action}` };
      }
    }

    case "manage_contact": {
      switch (action) {
        case "get": return getHistory(params, ctx);
        case "update": return update(params, ctx);
        case "capture-lead": return captureLead(params, ctx);
        case "update-stage": return updateLeadStage(params, ctx);
        case "get-pipeline": return getPipeline(params, ctx);
        case "schedule-follow-up": return scheduleFollowUp(params, ctx);
        default: return { success: false, error: `Unknown manage_contact action: ${action}` };
      }
    }

    case "manage_catalog": {
      const catalogAction = action || (params.query ? "search" : params.caption ? "send-media" : "");
      switch (catalogAction) {
        case "search": return searchMenu(params, ctx);
        case "list": return searchMenu({ query: "", category: undefined }, ctx);
        case "check-stock": return checkStock({ product_name: params.query || params.product_name || "" }, ctx);
        case "send-catalog": return sendCatalog(params, ctx);
        case "send-media": return sendMenuMedia(params, ctx);
        default: return { success: false, error: `Unknown manage_catalog action: ${action || "(empty)"}` };
      }
    }

    case "get_business_info":
      return getBusinessProfile({ sections: params.sections }, ctx);

    case "place_order":
      return placeOrder(params, ctx);

    case "transfer_agent":
      return requestHandoff(params, ctx);

    case "escalate": {
      switch (action) {
        case "create": return createTicket(params, ctx);
        case "status": return getTicketStatus(params, ctx);
        default: return { success: false, error: `Unknown escalate action: ${action}` };
      }
    }

    default:
      return { success: false, error: `Unknown tool: ${toolName}` };
  }
}
