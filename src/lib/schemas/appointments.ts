import { z } from "zod"

export const CreateAppointmentSchema = z.object({
  workspace_id: z.string().uuid(),
  customer_name: z.string().min(1, "Customer name is required"),
  customer_phone: z.string().optional(),
  service: z.string().optional(),
  start_at: z.string().datetime(),
  end_at: z.string().datetime(),
})

export const RescheduleAppointmentSchema = z.object({
  appointment_id: z.string().uuid(),
  start_at: z.string().datetime(),
  end_at: z.string().datetime(),
})
