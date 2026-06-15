"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Download, Trash2, ShieldCheck, ExternalLink, FileSpreadsheet, Mail } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function DataPrivacyPage() {
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleteStep, setDeleteStep] = useState<"confirm" | "otp">("confirm")
  const [deleteOtp, setDeleteOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const router = useRouter()

  async function handleExport() {
    setIsExporting(true)
    try {
      const res = await fetch("/api/user/data-export", { method: "POST" })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)

      const blob = new Blob([JSON.stringify(json.data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `flowcore-export-${new Date().toISOString().split("T")[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Data exported successfully")
    } catch (err: any) {
      toast.error(err.message || "Failed to export data")
    }
    setIsExporting(false)
  }

  async function handleDeleteRequestOtp() {
    setIsDeleting(true)
    try {
      const res = await fetch("/api/user/delete-account", { method: "POST" })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      if (json.requires_confirmation) {
        setOtpSent(true)
        setDeleteStep("otp")
        toast.success("Confirmation code sent to your email")
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send confirmation code")
    }
    setIsDeleting(false)
  }

  async function handleDeleteConfirm() {
    if (!deleteOtp.trim()) {
      toast.error("Please enter the confirmation code")
      return
    }
    setIsDeleting(true)
    try {
      const res = await fetch("/api/user/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation_token: deleteOtp }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)

      toast.success("Account deleted. Redirecting...")
      setTimeout(() => router.push("/"), 2000)
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account")
    }
    setIsDeleting(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data & Privacy</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your data, export, and account deletion</p>
      </div>

      <Card className="p-6 space-y-6">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-[#D95E46]/10 flex items-center justify-center shrink-0">
            <Download className="h-5 w-5 text-[#D95E46]" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Export Your Data</h3>
            <p className="text-sm text-gray-500 mt-1">
              Download all your workspace data including conversations, contacts, and configurations as JSON.
            </p>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="mt-4 bg-[#D95E46] hover:bg-[#E2735D] text-white"
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              Export Data
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-6">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Export Contacts as CSV</h3>
            <p className="text-sm text-gray-500 mt-1">
              Download all your contacts as a CSV file for use in Excel, Google Sheets, or other tools.
            </p>
            <a
              href="/api/user/export-contacts"
              className="inline-flex items-center mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </a>
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-6 border-red-100">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
            <Trash2 className="h-5 w-5 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Delete Account</h3>
            <p className="text-sm text-gray-500 mt-1">
              Permanently delete your account and all associated data. This action is irreversible.
            </p>
            {!showConfirm ? (
              <Button
                onClick={() => setShowConfirm(true)}
                variant="outline"
                className="mt-4 border-red-200 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            ) : deleteStep === "confirm" ? (
              <div className="mt-4 p-4 bg-red-50 rounded-lg space-y-3">
                <p className="text-sm font-medium text-red-700">
                  Are you sure? This will permanently delete all your data.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={handleDeleteRequestOtp}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                    Send Confirmation Code
                  </Button>
                  <Button
                    onClick={() => { setShowConfirm(false); setDeleteStep("confirm") }}
                    variant="outline"
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-4 bg-red-50 rounded-lg space-y-3">
                <p className="text-sm font-medium text-red-700">
                  Enter the confirmation code sent to your email to permanently delete your account.
                </p>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Label htmlFor="delete-otp" className="text-xs text-red-600">Confirmation Code</Label>
                    <Input
                      id="delete-otp"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={deleteOtp}
                      onChange={(e) => setDeleteOtp(e.target.value)}
                      className="mt-1 border-red-200"
                      maxLength={6}
                    />
                  </div>
                  <Button
                    onClick={handleDeleteConfirm}
                    disabled={isDeleting || !deleteOtp.trim()}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Delete Everything
                  </Button>
                </div>
                <Button
                  onClick={() => { setDeleteStep("confirm"); setOtpSent(false); setDeleteOtp("") }}
                  variant="ghost"
                  size="sm"
                  disabled={isDeleting}
                  className="text-red-600"
                >
                  Back
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5 text-blue-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Privacy & Legal</h3>
            <p className="text-sm text-gray-500 mt-1">
              Review our privacy policies and legal agreements.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              <Link href="/legal/privacy-policy" target="_blank" className="text-sm text-[#D95E46] hover:underline flex items-center gap-1">
                Privacy Policy <ExternalLink className="h-3 w-3" />
              </Link>
              <Link href="/legal/terms" target="_blank" className="text-sm text-[#D95E46] hover:underline flex items-center gap-1">
                Terms & Conditions <ExternalLink className="h-3 w-3" />
              </Link>
              <Link href="/legal/cookie-policy" target="_blank" className="text-sm text-[#D95E46] hover:underline flex items-center gap-1">
                Cookie Policy <ExternalLink className="h-3 w-3" />
              </Link>
              <Link href="/legal/data-deletion" target="_blank" className="text-sm text-[#D95E46] hover:underline flex items-center gap-1">
                Data Deletion Policy <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
