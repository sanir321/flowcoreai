import { PipelineContext, TierResult } from "../lib/types.ts";
import { matchChunks } from "../tools/impl/kb.ts";

function isSimpleGreetingOrAck(msg: string): boolean {
  const normalized = msg.toLowerCase().trim().replace(/[.,!?;]+$/, '');
  const simplePatterns = [
    /^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening))$/i,
    /^(thanks|thank\s*you|thx|ty)$/i,
    /^(ok|okay|k|cool|awesome|got\s*it|understood|perfect|great)$/i,
    /^(yes|yeah|yep|no|nope|sure|definitely|absolutely|maybe|not\s*really)$/i,
    /^(bye|goodbye|cya|see\s*ya|catch\s*you\s*later)$/i
  ];
  return simplePatterns.some(p => p.test(normalized)) || normalized.length <= 2;
}

export async function runT3(ctx: PipelineContext, requeryContext?: { previous_empty?: boolean; previous_query?: string }): Promise<TierResult> {
  const agentType = ctx.agentType || "customer_support";

  const promises: Promise<void>[] = [];

  if (agentType === "customer_support" || agentType === "sales") {
    const query = requeryContext?.previous_query || ctx.payload.message;
    const matchThreshold = requeryContext?.previous_empty ? 0.25 : undefined;
    
    // Phase 1 Optimization: Skip KB injection for simple greetings or acknowledgments
    if (isSimpleGreetingOrAck(query) && !requeryContext) {
      ctx._kbChunks = [];
    } else {
      promises.push(
        matchChunks({ query, match_threshold: matchThreshold }, ctx).then(result => {
          ctx._kbChunks = result?.chunks || result?.kb_chunks || result?.results || [];
        }).catch((e) => {
          console.error("[T3] KB chunk fetch error:", e?.message || e);
          ctx._kbChunks = [];
        })
      );
    }
  }

  if (agentType === "appointment_booking") {
    promises.push(
      ctx.supabase
        .from("appointments")
        .select("id, start_at, service, status, customer_name")
        .eq("session_id", ctx.session.id)
        .not("status", "eq", "cancelled")
        .maybeSingle()
        .then(({ data }: any) => {
          if (!data) {
            ctx._existingAppointment = null;
            return;
          }
          const nameInAppt = (data.customer_name || "").toLowerCase().trim();
          const nameInSession = (ctx.payload.customer_name || ctx.session.customer_name || "").toLowerCase().trim();
          if (nameInSession && nameInAppt && nameInSession !== nameInAppt) {
            console.debug(`[T3] Name mismatch: session "${nameInSession}" vs appointment "${nameInAppt}" — treating as new customer`);
            ctx._existingAppointment = null;
          } else {
            ctx._existingAppointment = data;
          }
        }).catch((e) => {
          console.error("[T3] Appointment lookup error:", e?.message || e);
          ctx._existingAppointment = null;
        })
    );
  }

  await Promise.all(promises);

  return { handled: false };
}
