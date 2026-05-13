import { z } from "zod"

export const ScrapeUrlSchema = z.object({
  workspace_id: z.string().uuid(),
  agent_id: z.string().uuid(),
  url: z.string().url(),
})

export const DeleteKbSourceSchema = z.object({
  source_id: z.string().uuid(),
  workspace_id: z.string().uuid(),
})
