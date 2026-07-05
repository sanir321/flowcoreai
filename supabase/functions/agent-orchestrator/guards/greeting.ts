import { PipelineContext, WorkspaceRow } from "../lib/types.ts";

const GREETING_PATTERNS = /^(hi|hello|hey|howdy|hola|good\s*(morning|afternoon|evening|day)|greetings|sup|yo|namaste|hiya|heya|what'?s\s*up|hii+|hell+o+)[\s!.,;:?\-~\p{Extended_Pictographic}]*(?:\s+(how|what|there|everyone)\s*.*)?$/iu;

export function checkGreeting(ctx: PipelineContext, workspace: WorkspaceRow): string | null {
  if ((ctx.session.message_count ?? 0) > 0) return null;

  const msg = (ctx.payload.message ?? "").trim();
  if (!GREETING_PATTERNS.test(msg)) return null;

  if (workspace.welcome_template) {
    return workspace.welcome_template;
  }

  const businessName = workspace.name ?? "our business";
  return `Hi! Welcome to ${businessName}. How can I help you today? 👋`;
}
