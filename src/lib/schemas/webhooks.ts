import { z } from "zod"

export const GoWAWebhookPayloadSchema = z.object({
  event: z.literal("message"),
  session: z.string().min(1),
  data: z.object({
    id: z.string().min(1),
    from: z.string().min(1),
    pushName: z.string().optional(),
    message: z.object({
      conversation: z.string().optional(),
    }),
    timestamp: z.number(),
  }),
});

export type GoWAWebhookPayload = z.infer<typeof GoWAWebhookPayloadSchema>;
