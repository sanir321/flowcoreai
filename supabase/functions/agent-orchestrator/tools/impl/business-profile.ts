import { PipelineContext } from "../../lib/types.ts";

export async function getBusinessProfile(params: { sections?: string[] }, ctx: PipelineContext) {
  const { data: workspace, error } = await ctx.supabase
    .from("workspaces")
    .select("business_profile")
    .eq("id", ctx.payload.workspace_id)
    .maybeSingle();

  if (error) {
    console.error("[BusinessProfile] Query error:", error.message);
    return { business_profile: null, success: false, error: "Failed to load profile" };
  }

  const profile = workspace?.business_profile;
  if (!profile) {
    return { business_profile: null, success: true };
  }

  if (params.sections && params.sections.length > 0) {
    const filtered: Record<string, unknown> = {};
    for (const section of params.sections) {
      if ((profile as Record<string, unknown>)[section] !== undefined) {
        filtered[section] = (profile as Record<string, unknown>)[section];
      }
    }
    return { business_profile: filtered, success: true };
  }

  return { business_profile: profile, success: true };
}
