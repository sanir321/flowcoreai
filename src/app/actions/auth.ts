"use server"

import { z } from "zod"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkUserExists } from "@/app/actions/workspace"

export interface SendOtpResult {
  error: string | null
  isOtpSent: boolean
}

export interface VerifyOtpResult {
  error: string | null
  targetRoute: string
}

const EmailSchema = z.string().email("Please enter a valid email address")
const OtpSchema = z.string().regex(/^\d{6}$/, "Please enter the 6-digit code")

async function getClientIp(): Promise<string> {
  try {
    const h = await headers()
    const forwarded = h.get("x-forwarded-for")
    if (forwarded) {
      const first = forwarded.split(",")[0]
      if (first) return first.trim()
    }
    const real = h.get("x-real-ip")
    if (real) return real.trim()
  } catch {
    // headers() unavailable (e.g. tests) — fall back to loopback
  }
  return "127.0.0.1"
}

/**
 * Sends a 6-digit email OTP.
 * Rate limiting / lockout is enforced server-side via `check_login_lockout`
 * and `record_login_attempt` RPCs (service role only — cannot be bypassed
 * from the client). Terms acceptance is enforced for new sign-ups.
 */
export async function sendOtpAction(input: {
  email: string
  acceptedTerms: boolean
}): Promise<SendOtpResult> {
  const parsed = z.object({
    email: EmailSchema,
    acceptedTerms: z.boolean(),
  }).safeParse(input)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please enter a valid email address", isOtpSent: false }
  }

  const { email, acceptedTerms } = parsed.data
  const clientIp = await getClientIp()
  const admin = createAdminClient()

  try {
    // Server-side lockout check
    const { data: lockout, error: lockoutError } = await admin.rpc("check_login_lockout", {
      p_email: email,
      p_ip: clientIp,
    })

    if (!lockoutError && lockout?.[0]?.locked) {
      const secs = lockout[0].lockout_seconds || 900
      return {
        error: `Too many attempts. Try again in ${Math.ceil(secs / 60)} minutes.`,
        isOtpSent: false,
      }
    }

    // Enforce terms acceptance for new sign-ups
    const { data: existsData } = await checkUserExists(email)
    const isNewUser = existsData ? !existsData.exists : true
    if (isNewUser && !acceptedTerms) {
      return { error: "You must accept the Privacy Policy and Terms & Conditions", isOtpSent: false }
    }

    const supabase = await createClient()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || "http://localhost:3000"

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${baseUrl}/auth/callback`,
      },
    })

    if (error) {
      try {
        await admin.rpc("record_login_attempt", { p_email: email, p_ip: clientIp, p_success: false })
      } catch {
        // non-critical — lockout tracking must not block the user
      }
      return { error: error.message, isOtpSent: false }
    }

    return { error: null, isOtpSent: true }
  } catch (err) {
    console.error("sendOtpAction error:", err)
    return { error: "Failed to send verification code. Please try again.", isOtpSent: false }
  }
}

/**
 * Verifies the 6-digit email OTP and establishes the Supabase session
 * (session cookies are written by the server client). Records the login
 * attempt and resolves the deterministic target route.
 */
export async function verifyOtpAction(input: {
  email: string
  token: string
}): Promise<VerifyOtpResult> {
  const parsed = z.object({
    email: EmailSchema,
    token: OtpSchema,
  }).safeParse(input)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid verification code", targetRoute: "" }
  }

  const { email, token } = parsed.data
  const clientIp = await getClientIp()
  const admin = createAdminClient()

  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    })

    if (error) {
      try {
        await admin.rpc("record_login_attempt", { p_email: email, p_ip: clientIp, p_success: false })
      } catch {
        // non-critical — lockout tracking must not block the user
      }
      return { error: error.message, targetRoute: "" }
    }

    try {
      await admin.rpc("record_login_attempt", { p_email: email, p_ip: clientIp, p_success: true })
    } catch {
      // non-critical
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: "Could not confirm your session. Please try again.", targetRoute: "" }
    }

    // Canonical workspace lookup — .limit(1) avoids PGRST116 with multiple workspaces
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id")
      .eq("owner_id", user.id)
      .eq("status", "active")
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle()

    return { error: null, targetRoute: workspace ? "/inbox" : "/onboarding" }
  } catch (err) {
    console.error("verifyOtpAction error:", err)
    return { error: "Failed to verify your code. Please try again.", targetRoute: "" }
  }
}

/**
 * Signs the current session out and clears Supabase session cookies.
 */
export async function signOutAction(): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()
    if (error) return { error: error.message }
    return { error: null }
  } catch (err) {
    console.error("signOutAction error:", err)
    return { error: "Failed to sign out. Please try again." }
  }
}
