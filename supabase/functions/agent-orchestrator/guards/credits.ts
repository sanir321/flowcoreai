import { PipelineContext, WorkspaceRow } from "../lib/types.ts";

const GOWA_BASE_URL = Deno.env.get("GOWA_BASE_URL")?.replace(/\/$/, "");
const GOWA_AUTH = Deno.env.get("GOWA_API_KEY") ? btoa(Deno.env.get("GOWA_API_KEY")!) : "";
const APP_URL = Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://flowter.vercel.app";

export async function checkCredits(ctx: PipelineContext, workspace: WorkspaceRow): Promise<string | null> {
  if ((workspace.credits_remaining ?? workspace.credits_balance ?? 0) > 0) return null;

  if (!workspace.low_credits_notified) {
    try {
      await ctx.supabase
        .from("workspaces")
        .update({ low_credits_notified: true })
        .eq("id", ctx.payload.workspace_id);

      const notifId = crypto.randomUUID();

      await ctx.supabase
        .from("notifications")
        .insert({
          id: notifId,
          workspace_id: ctx.payload.workspace_id,
          title: "Credits Exhausted",
          message: "Your workspace has run out of credits. Customer messages are being blocked. Upgrade your plan to continue serving customers.",
          type: "warning",
          link: "/settings/billing",
          created_at: new Date().toISOString(),
        });

      const ownerId = workspace.owner_id;
      if (ownerId) {
        const { data: ownerUser } = await ctx.supabase.auth.admin.getUserById(ownerId);
        const ownerEmail = ownerUser?.user?.email || null;
        const ownerPhone = workspace.owner_personal_phone || null;

        const internalSecret = Deno.env.get("INTERNAL_CRON_SECRET") || "";

        (async () => {
          try {
            await fetch(`${APP_URL}/api/internal/notify-low-credits`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${internalSecret}` },
              body: JSON.stringify({
                workspace_id: ctx.payload.workspace_id,
                owner_email: ownerEmail,
                owner_phone: ownerPhone,
              }),
            });
          } catch (e) {
            console.error("[CREDITS_GUARD] Internal notify fetch error:", e?.message || e);
          }

          if (ownerPhone && GOWA_BASE_URL && GOWA_AUTH) {
            try {
              const { data: gs } = await ctx.supabase
                .from("gowa_sessions")
                .select("gowa_session_id")
                .eq("workspace_id", ctx.payload.workspace_id)
                .maybeSingle();

              if (gs?.gowa_session_id) {
                let cleanedPhone = ownerPhone.replace(/\D/g, "");
                if (cleanedPhone.length === 10 && /^[6-9]/.test(cleanedPhone)) {
                  cleanedPhone = "91" + cleanedPhone;
                }
                await fetch(`${GOWA_BASE_URL}/send/message`, {
                  method: "POST",
                  headers: { Authorization: `Basic ${GOWA_AUTH}`, "Content-Type": "application/json", "X-Device-Id": gs.gowa_session_id },
                  body: JSON.stringify({
                    phone: cleanedPhone,
                    message: `⚠️ Your FlowCore workspace has run out of credits. Customer messages are being blocked. Upgrade your plan at ${APP_URL}/settings/billing`,
                  }),
                });
              }
            } catch (e) {
              console.error("[CREDITS_GUARD] WhatsApp alert send error:", e?.message || e);
            }
          }
        })();
      }
    } catch (e: any) {
      console.error("[CREDITS_GUARD] Notification error:", e?.message || e);
    }
  }

  return workspace.guardrail_config?.out_of_credits_message
    ?? "Our service is currently unavailable. Please contact the business directly.";
}
