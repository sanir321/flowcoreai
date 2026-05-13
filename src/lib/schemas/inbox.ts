import { z } from "zod"

export const SendManualReplySchema = z.object({
  session_id: z.string().uuid(),
  content: z.string().min(1).max(1000),
})

export const ResolveEscalationSchema = z.object({
  escalation_id: z.string().uuid(),
  notes: z.string().optional(),
})

export const TakeOverSessionSchema = z.object({
  session_id: z.string().uuid(),
})
