import { PipelineContext, WorkspaceRow } from "../lib/types.ts";

const SALES_GUARD_KEYWORDS = [
  "order", "buy", "purchase", "product", "menu",
  "service list", "what do you sell",
  "quote", "deal", "discount"
];

export function checkSales(ctx: PipelineContext, workspace: WorkspaceRow): string | null {
  if (workspace.guardrail_config?.allow_sales !== false) return null;

  const msgLower = ctx.payload.message.toLowerCase();
  if (SALES_GUARD_KEYWORDS.some(kw => msgLower.includes(kw))) {
    ctx.salesBlocked = true;
    // We no longer return a hard block string here, letting T3 handle the nuances.
  }
  return null;
}
