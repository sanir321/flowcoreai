import { PipelineContext } from "../../lib/types.ts";

export async function requestHandoff(
  params: { target_agent?: string; reason?: string; context?: string },
  ctx: PipelineContext
) {
  if (ctx.session.working_context?.transferred) {
    return { success: false, error: "Transfer already in progress." };
  }
  if (!params.target_agent) {
    return { success: false, error: "target_agent is required." };
  }
  return {
    success: true,
    handoff_to: params.target_agent,
    handoff_reason: params.reason || "",
    handoff_context: params.context || ""
  };
}
