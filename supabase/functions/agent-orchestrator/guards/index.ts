import { PipelineContext, TierResult, WorkspaceRow } from "../lib/types.ts";
import { checkNonText } from "./non-text.ts";
import { checkCredits } from "./credits.ts";
import { checkWhatsAppWindow } from "./window.ts";
import { checkEscalation } from "./escalation.ts";
import { checkBlockedTopics } from "./blocked-topics.ts";
import { checkPricing } from "./pricing.ts";
import { checkTokenBudget } from "./token-budget.ts";
import { checkGreeting } from "./greeting.ts";
import { checkSales } from "./sales.ts";

type GuardFn = (ctx: PipelineContext, workspace: WorkspaceRow) => string | null | Promise<string | null>;

async function runGuard(ctx: PipelineContext, workspace: WorkspaceRow, fn: GuardFn, reason: string): Promise<TierResult | null> {
  const response = await fn(ctx, workspace);
  if (response !== null) {
    return { handled: true, response, reason: `guardrail_${reason}` };
  }
  return null;
}

export async function runAllGuards(ctx: PipelineContext, workspace: WorkspaceRow): Promise<TierResult | null> {
  const guards: [GuardFn, string][] = [
    [checkNonText, "non_text"],
    [checkEscalation, "escalation"],
    [checkBlockedTopics, "blocked"],
    [checkCredits, "credits"],
    [checkWhatsAppWindow, "window"],
    [checkSales, "sales"],
    [checkPricing, "pricing"],
    [checkTokenBudget, "tokens"],
    [checkGreeting, "greeting"],
  ];

  for (const [fn, reason] of guards) {
    try {
      const result = await runGuard(ctx, workspace, fn, reason);
      if (result) return result;
    } catch (e) {
      console.error(`[GUARDS] Guard "${reason}" threw — isolating and continuing:`, e?.message || e);
    }
  }

  return null;
}
