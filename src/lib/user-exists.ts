import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Server-side only helper (NOT a server action, so it cannot be invoked
 * from the client). Checks whether an email exists in auth.users.
 *
 * SECURITY: pagination is bounded to prevent unbounded full-table
 * enumeration / DoS via the admin API. Used only by the pre-auth OTP flow.
 */
export async function userExistsByEmail(email: string): Promise<boolean> {
  const emailResult = z.string().email().safeParse(email)
  if (!emailResult.success) return false

  const supabase = createAdminClient()
  const pageSize = 200
  const MAX_PAGES = 5 // ~1,000 users scanned at most — far beyond current scale
  const normalized = emailResult.data.toLowerCase()

  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data: { users }, error } = await supabase.auth.admin.listUsers({ page, perPage: pageSize })
    if (error) throw error
    if (users.length === 0) break
    if (users.some((u) => u.email?.toLowerCase() === normalized)) return true
  }
  return false
}
