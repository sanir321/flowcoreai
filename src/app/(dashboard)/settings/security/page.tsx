"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

export default function SecurityPage() {
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [totpUri, setTotpUri] = useState("")
  const [totpSecret, setTotpSecret] = useState("")
  const [verifyCode, setVerifyCode] = useState("")
  const [unenrolling, setUnenrolling] = useState(false)
  const supabase = createClient()

  async function checkMfaStatus() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      // Check if user has TOTP factors
      const factors = user.factors || []
      const totpFactors = factors.filter((f: any) => f.factor_type === "totp" && f.status === "verified")
      setMfaEnabled(totpFactors.length > 0)
    } catch (err) {
      console.error("Failed to check MFA status:", err)
    }
    setLoading(false)
  }

  useEffect(() => {
    checkMfaStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleEnroll() {
    setEnrolling(true)
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "FlowCore Authenticator",
      })
      if (error) throw error

      setTotpUri(data.totp.uri)
      setTotpSecret(data.totp.secret)
    } catch (err: any) {
      toast.error(err.message || "Failed to start MFA enrollment")
    }
    setEnrolling(false)
  }

  async function handleVerify() {
    if (!verifyCode.trim()) {
      toast.error("Please enter the 6-digit code")
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("No active session")

      // Get the challenge
      const factors = (await supabase.auth.getUser()).data.user?.factors || []
      const totpFactor = factors.find((f: any) => f.factor_type === "totp" && f.id)
      if (!totpFactor) throw new Error("No TOTP factor found")

      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id,
      })
      if (challengeError) throw challengeError

      // Verify the code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challengeData.id,
        code: verifyCode,
      })
      if (verifyError) throw verifyError

      toast.success("MFA enabled successfully!")
      setMfaEnabled(true)
      setTotpUri("")
      setTotpSecret("")
      setVerifyCode("")
    } catch (err: any) {
      toast.error(err.message || "Invalid code. Please try again.")
    }
  }

  async function handleUnenroll() {
    setUnenrolling(true)
    try {
      const factors = (await supabase.auth.getUser()).data.user?.factors || []
      const totpFactor = factors.find((f: any) => f.factor_type === "totp" && f.status === "verified")
      if (!totpFactor) throw new Error("No MFA factor found")

      const { error } = await supabase.auth.mfa.unenroll({ factorId: totpFactor.id })
      if (error) throw error

      toast.success("MFA disabled")
      setMfaEnabled(false)
    } catch (err: any) {
      toast.error(err.message || "Failed to disable MFA")
    }
    setUnenrolling(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Security</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account security settings</p>
      </div>

      <Card className="p-6 space-y-6">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Two-Factor Authentication (MFA)</h3>
            <p className="text-sm text-gray-500 mt-1">
              Add an extra layer of security to your account with authenticator app verification.
            </p>

            {mfaEnabled ? (
              <div className="mt-4 p-4 bg-emerald-50 rounded-lg">
                <div className="flex items-center gap-2 text-emerald-700 font-medium">
                  <ShieldCheck className="h-4 w-4" />
                  MFA is enabled
                </div>
                <p className="text-sm text-emerald-600 mt-1">
                  Your account is protected with two-factor authentication.
                </p>
                <Button
                  onClick={handleUnenroll}
                  disabled={unenrolling}
                  variant="outline"
                  className="mt-3 border-red-200 text-red-600 hover:bg-red-50"
                >
                  {unenrolling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldOff className="h-4 w-4 mr-2" />}
                  Disable MFA
                </Button>
              </div>
            ) : !totpUri ? (
              <Button
                onClick={handleEnroll}
                disabled={enrolling}
                className="mt-4 bg-[#D95E46] hover:bg-[#E2735D] text-white"
              >
                {enrolling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                Enable MFA
              </Button>
            ) : (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    1. Scan this QR code with your authenticator app:
                  </p>
                  <div className="flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=${encodeURIComponent(totpUri)}`}
                      alt="Scan with authenticator app"
                      className="rounded-lg border"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    2. Enter the 6-digit code from your authenticator:
                  </p>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Input
                        type="text"
                        placeholder="000000"
                        value={verifyCode}
                        onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="font-mono text-lg tracking-widest"
                        maxLength={6}
                      />
                    </div>
                    <Button
                      onClick={handleVerify}
                      disabled={verifyCode.length !== 6}
                      className="bg-[#D95E46] hover:bg-[#E2735D] text-white"
                    >
                      Verify & Enable
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={() => { setTotpUri(""); setTotpSecret(""); setVerifyCode("") }}
                  variant="ghost"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
