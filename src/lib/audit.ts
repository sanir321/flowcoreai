import { createClient } from "@/lib/supabase/server"

interface AuditLogInput {
  workspace_id: string
  action: string
  entity_type: string
  entity_id?: string
  payload?: Record<string, any>
}

export async function logAudit({
  workspace_id,
  action,
  entity_type,
  entity_id,
  payload = {}
}: AuditLogInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    await supabase.from("audit_logs").insert({
      workspace_id,
      actor_id: user?.id,
      action,
      entity_type,
      entity_id,
      payload
    })
  } catch (err) {
    console.error("[AUDIT_LOG_FAILED]", err)
  }
}
