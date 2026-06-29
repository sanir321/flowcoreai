import { PipelineContext, TierResult } from "../lib/types.ts";
import { matchChunks } from "../tools/impl/kb.ts";

export async function runT3(ctx: PipelineContext, requeryContext?: { previous_empty?: boolean; previous_query?: string }): Promise<TierResult> {
  const agentType = ctx.agentType || "customer_support";

  const promises: Promise<void>[] = [];

  if (agentType === "customer_support" || agentType === "sales") {
    const query = requeryContext?.previous_query || ctx.payload.message;
    const matchThreshold = requeryContext?.previous_empty ? 0.25 : undefined;
    promises.push(
      matchChunks({ query, match_threshold: matchThreshold }, ctx).then(result => {
        ctx._kbChunks = result?.chunks || result?.kb_chunks || result?.results || [];
      }).catch(() => {
        ctx._kbChunks = [];
      })
    );
  }

  if (agentType === "appointment_booking") {
    promises.push(
      ctx.supabase
        .from("appointments")
        .select("id, start_at, service, status")
        .eq("session_id", ctx.session.id)
        .not("status", "eq", "cancelled")
        .maybeSingle()
        .then(({ data }: any) => {
          ctx._existingAppointment = data || null;
        }).catch(() => {
          ctx._existingAppointment = null;
        })
    );
  }

  await Promise.all(promises);

  if (ctx.routingReason === "management_priority" && agentType === "appointment_booking") {
    try {
      const { getHistory } = await import("../tools/impl/contact.ts");
      const history = await getHistory({}, ctx);
      ctx._customerHistory = history?.appointments || [];
    } catch (_) {}
  }

  return { handled: false };
}
