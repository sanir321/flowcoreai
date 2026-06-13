import { createClient } from "jsr:@supabase/supabase-js@2";

export type TemplateKey =
  | "booking_service_prompt"
  | "booking_date_prompt"
  | "booking_time_prompt"
  | "booking_name_prompt"
  | "booking_email_prompt"
  | "booking_confirmation"
  | "invalid_service_response";

export const DEFAULT_TEMPLATES: Record<TemplateKey, string> = {
  booking_service_prompt: "What service would you like to book? We offer: {{services}}",
  booking_date_prompt: "What date would you like the appointment?",
  booking_time_prompt: "What time works best for you?",
  booking_name_prompt: "Could you please tell me your name?",
  booking_email_prompt: "What email address should I use for the confirmation?",
  booking_confirmation: "Your appointment for {{service}} on {{date}} at {{time}} is confirmed!",
  invalid_service_response: "We don't offer that. Available: {{services}}"
};

export async function getTemplate(
  workspaceId: string,
  key: TemplateKey,
  fallback: string
): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseKey) return fallback;

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data } = await supabase
    .from("business_templates")
    .select("content")
    .eq("workspace_id", workspaceId)
    .eq("template_key", key)
    .maybeSingle();

  return data?.content || fallback;
}

export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || "");
}
