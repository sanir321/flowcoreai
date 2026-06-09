"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, CheckCircle2, Loader2, Sparkles } from "lucide-react"
import Link from "next/link"

export default function WaitlistPage() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes("@")) return

    setStatus("loading")
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to join waitlist")
      }

      setStatus("success")
      setEmail("")
    } catch (err: any) {
      setStatus("error")
      setErrorMessage(err.message)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(180deg, #0d0705 0%, #080505 30%, #050505 60%)" }}>
      {/* Sleek Header */}
      <header className="h-14 flex items-center justify-between px-6 lg:px-12 fixed top-0 left-0 right-0 z-50">
        <Link href="/" className="text-base font-medium tracking-tight text-[#e5e5e5]">
          FlowCore
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(198, 95, 57, 0.15) 0%, transparent 70%)", filter: "blur(40px)" }} />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-md w-full relative z-10"
        >
          <div className="text-center space-y-6 mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-sm font-medium text-white/80 mb-4">
              <Sparkles className="w-4 h-4 text-[#c65f39]" />
              Early Access
            </div>
            <h1 className="text-4xl md:text-5xl font-normal tracking-tight text-white leading-tight">
              Join the <span style={{ color: "#c65f39" }}>Waitlist</span>
            </h1>
            <p className="text-[#a3a3a3] text-lg">
              Get early access to FlowCore's automated customer service agents before we open to the public.
            </p>
          </div>

          <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            {/* Subtle card glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#c65f39] rounded-full blur-[80px] opacity-20" />

            <AnimatePresence mode="wait">
              {status === "success" ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center text-center py-6 space-y-4"
                >
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-medium text-white">You're on the list!</h3>
                  <p className="text-[#a3a3a3] text-sm">
                    We'll email you as soon as a spot opens up. Keep an eye on your inbox.
                  </p>
                  <Button asChild variant="ghost" className="mt-4 text-white/70 hover:text-white hover:bg-white/10">
                    <Link href="/">Return Home</Link>
                  </Button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-4 relative"
                >
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-white/80">
                      Work Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (status === "error") setStatus("idle")
                      }}
                      className="h-12 bg-black/50 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#c65f39] focus-visible:border-[#c65f39]"
                    />
                  </div>

                  {status === "error" && (
                    <p className="text-red-400 text-sm">{errorMessage}</p>
                  )}

                  <Button 
                    type="submit" 
                    disabled={status === "loading"}
                    className="w-full h-12 text-white font-medium text-base relative overflow-hidden group"
                    style={{ background: "#c65f39" }}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {status === "loading" ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          Join Waitlist
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </span>
                  </Button>
                  
                  <p className="text-xs text-center text-[#666] pt-2">
                    No spam. Unsubscribe at any time.
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>
    </div>
  )
}