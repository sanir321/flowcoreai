import { z } from "zod"

export const UpdateContactSchema = z.object({
  contact_id: z.string().uuid(),
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
})
