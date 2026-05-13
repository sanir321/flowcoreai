import { z } from "zod"

export const FinalizeOnboardingSchema = z.object({
  workspace_id: z.string().uuid(),
  agent_types: z.array(z.enum(['customer_support', 'appointment_booking', 'sales'])).min(1),
})

export const AddAgentSchema = z.object({
  workspace_id: z.string().uuid(),
  agent_type: z.enum(['customer_support', 'appointment_booking', 'sales']),
})

export const UpdateAgentConfigSchema = z.object({
  agent_id: z.string().uuid(),
  config: z.record(z.string(), z.unknown()),
})

export const SetAgentStatusSchema = z.object({
  agent_id: z.string().uuid(),
  status: z.enum(['active', 'paused']),
})

export const DeleteAgentSchema = z.object({
  agent_id: z.string().uuid(),
})
