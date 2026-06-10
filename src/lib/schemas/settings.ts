import { z } from "zod"

export const UpdateNotificationsSchema = z.object({
  workspace_id: z.string().uuid(),
  email_on_escalation: z.boolean().optional(),
  email_on_booking: z.boolean().optional(),
  email_on_lead: z.boolean().optional(),
  whatsapp_alert_number: z.string().optional(),
  notification_mode: z.enum(['instant', 'digest', 'off']).optional(),
})

export const UpdateWidgetConfigSchema = z.object({
  workspace_id: z.string().uuid(),
  accent_color: z.string().optional(),
  greeting: z.string().optional(),
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  allowed_domains: z.array(z.string()).optional(),
  avatar_url: z.string().url().optional().or(z.literal("")),
  header_text: z.string().optional(),
  agent_name: z.string().optional(),
  post_form_message: z.string().optional(),
  logo_url: z.string().url().optional().or(z.literal("")),
  launcher_icon: z.string().optional(),
  enable_whatsapp: z.boolean().optional(),
  allow_anonymous: z.boolean().optional(),
  auto_fill_params: z.boolean().optional(),
  default_country: z.string().optional(),
  email_notifications: z.boolean().optional(),
})
