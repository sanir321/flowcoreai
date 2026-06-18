import { PipelineContext } from "../../lib/types.ts";

export async function requestHandoff(
  params: { target_agent?: string; reason?: string; context?: string },
  ctx: PipelineContext
) {
  if (ctx.session.working_context?.transferred) {
    return { error: "Transfer already in progress." };
  }
  return {
    handoff_to: params.target_agent,
    handoff_reason: params.reason || "",
    handoff_context: params.context || ""
  };
}
