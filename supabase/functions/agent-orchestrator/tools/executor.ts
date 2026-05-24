import { PipelineContext } from "../lib/types.ts";
import { matchChunks } from "./impl/kb.ts";
import { checkAvailability, createAppointment, updateAppointment, cancelAppointment } from "./impl/calendar.ts";
import { getHistory, update } from "./impl/contact.ts";
import { captureLead, updateLeadStage, getPipeline, scheduleFollowUp, generateQuote } from "./impl/crm.ts";
import { searchMenu, sendMenuMedia, createOrder, confirmPayment, getOrderStatus } from "./impl/order.ts";
import { requestHandoff } from "./impl/handoff.ts";
import { createTicket } from "./impl/support-ticket.ts";

const TOOL_RATE_LIMITS: Record<string, number> = {
  check_availability: 5,
  create_appointment: 2,
  create_order: 3,
  confirm_payment: 3,
  match_kb_chunks: 10,
  send_menu_media: 3,
  capture_lead: 2,
  request_handoff: 1,
  create_ticket: 3,
};

const countCache = new WeakMap<PipelineContext, Record<string, number>>();

export const toolExecutor = {
  async run(toolName: string, params: Record<string, unknown>, ctx: PipelineContext): Promise<any> {
    const startTime = Date.now();
    let result: any;

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

    try {
      result = await routeToImpl(toolName, params, ctx);
    } catch (error: any) {
      result = { success: false, error: error.message };
    }

    await ctx.supabase.from("tool_call_logs").insert({
      session_id: ctx.session.id,
      workspace_id: ctx.payload.workspace_id,
      tool_name: toolName,
      args: params,
      result: result.data || result,
      error: result.error,
      success: !result.error,
      duration_ms: Date.now() - startTime
    });

    return result;
  }
};

async function routeToImpl(toolName: string, params: any, ctx: PipelineContext): Promise<any> {
  switch (toolName) {
    case "match_kb_chunks": return matchChunks(params, ctx);
    case "check_availability": return checkAvailability(params, ctx);
    case "create_appointment": return createAppointment(params, ctx);
    case "update_appointment": return updateAppointment(params, ctx);
    case "cancel_appointment": return cancelAppointment(params, ctx);
    case "capture_lead": return captureLead(params, ctx);
    case "get_contact_history": return getHistory(params, ctx);
    case "update_contact": return update(params, ctx);
    case "search_menu": return searchMenu(params, ctx);
    case "send_menu_media": return sendMenuMedia(params, ctx);
    case "create_order": return createOrder(params, ctx);
    case "confirm_payment": return confirmPayment(params, ctx);
    case "get_order_status": return getOrderStatus(params, ctx);
    case "request_handoff": return requestHandoff(params, ctx);
    case "update_lead_stage": return updateLeadStage(params, ctx);
    case "get_pipeline": return getPipeline(params, ctx);
    case "schedule_follow_up": return scheduleFollowUp(params, ctx);
    case "generate_quote": return generateQuote(params, ctx);
    case "create_ticket": return createTicket(params, ctx);
    default: return { success: false, error: `Unknown tool: ${toolName}` };
  }
}
