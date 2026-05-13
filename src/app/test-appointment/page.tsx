"use client"

import { createAppointment } from "@/app/actions/appointments"

export default function TestAppointmentPage() {

  async function runTest() {
    const workspaceId = "7626c093-3ba5-444c-bcc6-5192fa985410"
  
    const start = new Date()
    start.setHours(start.getHours() + 1, 0, 0, 0)
    const end = new Date(start.getTime() + 30 * 60 * 1000)

    const appointmentData = {
      workspace_id: workspaceId,
      customer_name: "Live Test Client",
      customer_phone: "918072432187",
      service: "Live Test Consultation",
      start_at: start.toISOString(),
      end_at: end.toISOString(),
    }

    console.log("Attempting to create appointment from live page...")
    console.log("Payload:", JSON.stringify(appointmentData, null, 2))

    try {
      const result = await createAppointment(appointmentData)

      if (result.error) {
        throw new Error(result.error)
      }

      alert("Appointment test successful! Check console for details.")
      console.log("--- Appointment Test Result ---")
      console.log("✅ Appointment created in DB:", result.data.id)
      if (result.data.calendar_synced) {
        console.log("✅ Google Calendar event created:", result.data.google_event_id)
      } else {
        console.warn("⚠️ Google Calendar sync failed.")
      }

    } catch (error) {
      alert("Appointment test failed! Check console for details.")
      console.error("--- Appointment Test FAILED ---", error)
    }
  }

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif" }}>
      <h1>Appointment Creation Test</h1>
      <p>
        Click the button to attempt to create an appointment for workspace 7626c093-3ba5-444c-bcc6-5192fa985410.
        <br />
        You must be logged in. The Google integration for this workspace must be active.
      </p>
      <button 
        onClick={runTest} 
        style={{ 
          marginTop: "20px", 
          padding: "10px 20px", 
          fontSize: "16px", 
          cursor: "pointer" 
        }}
      >
        Run Test
      </button>
    </div>
  )
}
