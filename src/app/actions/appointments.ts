"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { CreateAppointmentSchema, RescheduleAppointmentSchema } from "@/lib/schemas/appointments"
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from "@/lib/google"
import { ActionResponse } from "./workspace"

export async function createAppointment(input: unknown): Promise<ActionResponse<any>> {
  try {
    const result = CreateAppointmentSchema.safeParse(input)
    if (!result.success) {
      return { data: null, error: "Invalid appointment data" }
    }

    const supabase = await createClient()
    const { workspace_id, customer_name, customer_phone, service, start_at, end_at } = result.data

    // 1. Create Google Calendar Event
    let google_event_id = null
    let calendar_synced = false
    try {
      const event = await createCalendarEvent(workspace_id, {
        summary: `${service || 'Appointment'}: ${customer_name}`,
        description: `Customer: ${customer_name}\nPhone: ${customer_phone || 'N/A'}\nService: ${service || 'N/A'}`,
        start: { dateTime: start_at },
        end: { dateTime: end_at }
      })
      google_event_id = event.id
      calendar_synced = true
    } catch (err) {
      console.warn("[CALENDAR_SYNC_FAILED]", err)
    }

    // 2. Save to DB
    const { data, error } = await supabase
      .from("appointments")
      .insert({
        workspace_id,
        customer_name,
        customer_phone,
        service: service || 'General Booking',
        start_at,
        end_at,
        google_event_id,
        status: 'confirmed'
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath("/appointments")
    return { data: { ...data, calendar_synced }, error: null }
  } catch (err) {
    console.error(err)
    return { data: null, error: err instanceof Error ? err.message : "Failed to create appointment" }
  }
}

export async function rescheduleAppointment(input: unknown): Promise<ActionResponse<any>> {
  try {
    const result = RescheduleAppointmentSchema.safeParse(input)
    if (!result.success) {
      return { data: null, error: "Invalid reschedule data" }
    }

    const supabase = await createClient()
    const { appointment_id, start_at, end_at } = result.data

    const { data: existing } = await supabase
      .from("appointments")
      .select("google_event_id, workspace_id")
      .eq("id", appointment_id)
      .single()

    if (existing?.google_event_id) {
      try {
        await updateCalendarEvent(existing.workspace_id, existing.google_event_id, {
          start: { dateTime: start_at },
          end: { dateTime: end_at }
        })
      } catch (err) {
        console.warn("[CALENDAR_UPDATE_FAILED]", err)
      }
    }

    const { data, error } = await supabase
      .from("appointments")
      .update({
        start_at,
        end_at,
        status: 'rescheduled',
        updated_at: new Date().toISOString()
      })
      .eq("id", appointment_id)
      .select()
      .single()

    if (error) throw error

    revalidatePath("/appointments")
    return { data, error: null }
  } catch (err) {
    console.error(err)
    return { data: null, error: err instanceof Error ? err.message : "Failed to reschedule appointment" }
  }
}

export async function cancelAppointment(appointment_id: string): Promise<ActionResponse<any>> {
  try {
    const supabase = await createClient()

    // 1. Get current appointment to check for google_event_id
    const { data: appt } = await supabase
      .from("appointments")
      .select("workspace_id, google_event_id")
      .eq("id", appointment_id)
      .single()

    if (appt?.google_event_id) {
      try {
        await deleteCalendarEvent(appt.workspace_id, appt.google_event_id)
      } catch (err) {
        console.warn("[CALENDAR_DELETE_FAILED]", err)
      }
    }

    const { data, error } = await supabase
      .from("appointments")
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq("id", appointment_id)
      .select()
      .single()

    if (error) throw error

    revalidatePath("/appointments")
    return { data, error: null }
  } catch (err) {
    console.error(err)
    return { data: null, error: err instanceof Error ? err.message : "Failed to cancel appointment" }
  }
}
