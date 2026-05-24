import { PipelineContext, TierResult } from "../lib/types.ts";
import { checkNonText } from "./non-text.ts";
import { checkCredits } from "./credits.ts";
import { checkWhatsAppWindow } from "./window.ts";
import { checkEscalation } from "./escalation.ts";
import { checkBlockedTopics } from "./blocked-topics.ts";
import { checkPricing } from "./pricing.ts";
import { checkTokenBudget } from "./token-budget.ts";
import { checkGreeting } from "./greeting.ts";
import { checkSales } from "./sales.ts";

export interface GuardResult {
  handled: boolean;
  response?: string | null;
  reason?: string;
}

type GuardFn = (ctx: PipelineContext, workspace: any) => string | null | Promise<string | null>;

async function runGuard(ctx: PipelineContext, workspace: any, fn: GuardFn, reason: string): Promise<GuardResult | null> {
  const response = await fn(ctx, workspace);
  if (response !== null) {
    return { handled: true, response, reason: `guardrail_${reason}` };
  }
  return null;
}

export async function runAllGuards(ctx: PipelineContext, workspace: any): Promise<GuardResult | null> {
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
    const result = await runGuard(ctx, workspace, fn, reason);
    if (result) return result;
  }

  return null;
}
