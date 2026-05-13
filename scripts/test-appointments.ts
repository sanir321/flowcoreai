// scripts/test-appointments.ts
import { createAppointment } from "../src/app/actions/appointments"

async function testAppointmentCreation() {
  const workspaceId = "7626c093-3ba5-444c-bcc6-5192fa985410"
  
  const start = new Date()
  start.setHours(start.getHours() + 1, 0, 0, 0) // Next hour
  const end = new Date(start.getTime() + 30 * 60 * 1000) // 30 mins later

  const appointmentData = {
    workspace_id: workspaceId,
    customer_name: "CLI Test Client",
    customer_phone: "918072432187",
    service: "Test Consultation",
    start_at: start.toISOString(),
    end_at: end.toISOString(),
  }

  console.log("Attempting to create appointment...")
  console.log("Payload:", JSON.stringify(appointmentData, null, 2))

  try {
    const result = await createAppointment(appointmentData)

    if (result.error) {
      throw new Error(result.error)
    }

    console.log("
--- Appointment Test Result ---")
    console.log("✅ Appointment created successfully in database.")
    console.log("  - DB Appointment ID:", result.data.id)
    
    if (result.data.calendar_synced) {
      console.log("✅ Google Calendar event created successfully.")
      console.log("  - Google Event ID:", result.data.google_event_id)
    } else {
      console.log("⚠️ Google Calendar sync failed. Check server logs.")
    }
    console.log("---------------------------------
")

  } catch (error) {
    console.error("
--- Appointment Test FAILED ---")
    console.error(error)
    console.log("---------------------------------
")
  }
}

testAppointmentCreation()
