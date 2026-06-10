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
  agent_name: z.string().optional(),
  allow_anonymous: z.boolean().optional(),
  enable_whatsapp: z.boolean().optional(),
  header_text: z.string().optional(),
  post_form_message: z.string().optional(),
  launcher_icon: z.string().optional(),
  auto_fill_params: z.boolean().optional(),
  email_notifications: z.boolean().optional(),
  whatsapp_number: z.string().optional(),
})
