import { PipelineContext } from "../lib/types.ts";

const PRICING_KEYWORDS = [
  "price", "cost", "how much", "rate", "pricing", "charge", "fee",
  "what is the price", "what are your rates", "how much does",
  "cost of", "price list", "rate card", "多少钱"
];

export function checkPricing(ctx: PipelineContext, workspace: any): string | null {
  if (workspace.guardrail_config?.allow_pricing !== false) return null;

  const msgLower = ctx.payload.message.toLowerCase();
  if (PRICING_KEYWORDS.some(kw => msgLower.includes(kw))) {
    ctx.pricingBlocked = true;
    // We no longer return a hard block string here, letting T3 handle the nuances.
  }
  return null;
}
