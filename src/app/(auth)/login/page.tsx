"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"
import { checkUserExists } from "@/app/actions/workspace"
import { motion, AnimatePresence } from "framer-motion"

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [termsError, setTermsError] = useState("")
  
  const router = useRouter()
  const supabase = createClient()

  // Note: Magic link sign-in is handled by /auth/callback route directly.
  // We do NOT auto-redirect on auth state change here to avoid confusing UX
  // when email clients prefetch magic links while the OTP form is visible.

  const handleGoogleLogin = async () => {
    setIsLoading(true)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      toast.error(error.message)
      setIsLoading(false)
    }
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setTermsError("")
    setIsLoading(true)

    // Check login lockout
    try {
      const ipRes = await fetch("https://api.ipify.org?format=json")
      const { ip } = await ipRes.json()
      const { data: lockout } = await (supabase as any).rpc("check_login_lockout", {
        p_email: email,
        p_ip: ip,
      })
      if (lockout?.[0]?.locked) {
        const secs = lockout[0].lockout_seconds || 900
        toast.error(`Too many attempts. Try again in ${Math.ceil(secs / 60)} minutes.`)
        setIsLoading(false)
        return
      }
    } catch { /* proceed if check fails */ }

    // Check if this is a new or existing user
    const result = await checkUserExists(email)
    if (result.error) {
      console.error("checkUserExists error:", result.error)
      toast.error("Unable to verify account. Please try again.")
      setIsLoading(false)
      return
    }
    const isNewUser = !result.data?.exists

    if (isNewUser && !acceptedTerms) {
      setTermsError("You must accept the Privacy Policy and Terms & Conditions")
      setIsLoading(false)
      return
    }

    // Explicitly send OTP
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      // Record failed attempt
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json")
        const { ip } = await ipRes.json()
        await (supabase as any).rpc("record_login_attempt", { p_email: email, p_ip: ip, p_success: false })
      } catch { /* non-critical */ }
      toast.error(error.message)
    } else {
      setIsOtpSent(true)
      toast.success("Verification code sent to your email")
    }
    setIsLoading(false)
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email'
    })

    if (error) {
      // Record failed attempt for lockout tracking
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json")
        const { ip } = await ipRes.json()
        await (supabase as any).rpc("record_login_attempt", { p_email: email, p_ip: ip, p_success: false })
      } catch { /* non-critical */ }
      toast.error(error.message)
    } else {
      // Record successful login
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json")
        const { ip } = await ipRes.json()
        await (supabase as any).rpc("record_login_attempt", { p_email: email, p_ip: ip, p_success: true })
      } catch { /* non-critical */ }
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const isNewUser = !user.last_sign_in_at || (new Date().getTime() - new Date(user.created_at).getTime() < 10000);
        try {
          const { sendAuthEmail } = await import("@/app/actions/auth");
          await sendAuthEmail({
            email: user.email!,
            isNewUser,
            username: user.user_metadata?.full_name || user.email?.split("@")[0] || "there",
          });
        } catch (emailErr) {
          console.error("Failed to send auth notification email:", emailErr);
        }

        const workspaceId = user.app_metadata?.workspace_id
        if (workspaceId) {
          const { data: ws } = await supabase
            .from("workspaces")
            .select("id")
            .eq("id", workspaceId)
            .is("deleted_at", null)
            .maybeSingle()
          if (ws) {
            router.push("/inbox")
            return
          }
        }

        const { data: workspace } = await supabase
          .from("workspaces")
          .select("id")
          .eq("owner_id", user.id)
          .eq("status", "active")
          .is("deleted_at", null)
          .maybeSingle()
        
        if (workspace) {
          router.push("/inbox")
        } else {
          router.push("/onboarding")
        }
      }
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex bg-[#0A0A0A] text-white font-sans selection:bg-[#D95E46]/30 selection:text-white overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] z-[100] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      {/* Left Side: Authentication Interface */}
      <div className="w-full lg:w-[45%] min-h-screen flex flex-col p-8 lg:px-16 lg:py-16 justify-center relative z-50 bg-[#0A0A0A]">
        <div className="max-w-sm w-full mx-auto space-y-10">
          {/* Brand Identity */}
          <div className="space-y-4">
            <Link href="/" className="h-10 w-10 rounded-xl bg-[#D95E46] flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-500">
              <span className="text-white font-bold text-base tracking-tighter">F</span>
            </Link>
            <div className="space-y-1">
               <h2 className="text-lg font-semibold tracking-tight text-white">FlowCore</h2>
               <p className="text-xs text-gray-500 font-medium">AI agent platform</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold text-white tracking-tight">
                {isOtpSent ? "Verification" : "Sign in"}
              </h1>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                {isOtpSent ? `We sent a code to ${email}` : "Sign in to manage your agents and conversations."}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {!isOtpSent ? (
                <motion.div
                  key="email-step"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <Button 
                    onClick={handleGoogleLogin}
                    className="w-full h-12 rounded-xl bg-white text-black hover:bg-gray-100 flex items-center justify-center gap-3 transition-all font-semibold text-sm shadow-sm"
                    disabled={isLoading}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-3.3 3.28-8.19 3.28-11.5z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.48-.98 7.31-2.65l-3.57-2.77c-1.01.68-2.31 1.09-3.74 1.09-2.88 0-5.32-1.95-6.19-4.57H2.18v2.85C4.01 20.15 7.74 23 12 23z" fill="#34A853" />
                      <path d="M5.81 14.1c-.22-.68-.35-1.41-.35-2.1s.13-1.42.35-2.1V7.05H2.18C1.41 8.54 1 10.22 1 12s.41 3.46 1.18 4.95L5.81 14.1z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.07.56 4.21 1.66l3.15-3.15C17.21 1.88 14.7 1 12 1 7.74 1 4.01 3.85 2.18 7.05l3.63 2.85c.87-2.62 3.31-4.57 6.19-4.57z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-white/5" />
                    </div>
                    <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
                      <span className="bg-[#0A0A0A] px-4 text-gray-600">or use email</span>
                    </div>
                  </div>

                  <form onSubmit={handleSendOtp} className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-gray-400 ml-1">Email Address</Label>
                      <Input 
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setTermsError("") }}
                        required
                        className="h-12 bg-[#141414] border-white/5 focus:border-[#D95E46]/50 text-white rounded-xl placeholder:text-gray-700 transition-all font-medium"
                      />
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <Checkbox
                        checked={acceptedTerms}
                        onCheckedChange={(checked) => { setAcceptedTerms(checked === true); setTermsError("") }}
                        className="mt-0.5 border-neutral-600 data-[state=checked]:bg-[#D95E46] data-[state=checked]:border-[#D95E46]"
                      />
                      <span className="text-xs text-neutral-500 leading-relaxed">
                        I accept the{" "}
                        <Link href="/legal/privacy-policy" target="_blank" className="text-[#D95E46] hover:underline font-medium">Privacy Policy</Link>
                        {" "}and{" "}
                        <Link href="/legal/terms" target="_blank" className="text-[#D95E46] hover:underline font-medium">Terms & Conditions</Link>
                      </span>
                    </label>
                    {termsError && (
                      <p className="text-red-500 text-[10px] font-bold -mt-2">{termsError}</p>
                    )}

                    <Button 
                      type="submit"
                      className="w-full h-12 rounded-xl bg-[#D95E46] hover:bg-[#c54f37] text-white font-semibold text-sm transition-all active:scale-95 shadow-md"
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Continue with Email"}
                    </Button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="otp-step"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <form onSubmit={handleVerifyOtp} className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-gray-400 ml-1">Code</Label>
                      <Input 
                        type="text"
                        placeholder="000000"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        maxLength={6}
                        className="h-14 bg-[#141414] border-white/5 focus:border-[#D95E46]/50 text-white rounded-xl text-center tracking-[0.4em] text-xl font-bold transition-all"
                      />
                    </div>

                    <Button 
                      type="submit"
                      className="w-full h-12 rounded-xl bg-[#D95E46] hover:bg-[#c54f37] text-white font-semibold text-sm transition-all active:scale-95 shadow-md"
                      disabled={isLoading || otp.length !== 6}
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Verify and Continue"}
                    </Button>
                  </form>

                  <button 
                    onClick={() => setIsOtpSent(false)}
                    className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-gray-500 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Back to email
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="pt-8 border-t border-white/5">
             <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest">Secure cloud authentication active</p>
          </div>
        </div>
      </div>

      {/* Right Side: Stable Metallic Orbital Graphic */}
      <div className="hidden lg:flex flex-1 relative bg-[#0A0A0A] items-center justify-center overflow-hidden border-l border-white/5 min-h-screen">
        {/* Subtle Grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Atmospheric Lighting */}
          <div className="absolute w-[1000px] h-[1000px] rounded-full bg-[#D95E46]/5 blur-[160px] animate-pulse" />
          <div className="absolute w-[600px] h-[600px] rounded-full bg-white/5 blur-[100px]" />
          
          <div className="relative z-10">
            <svg width="600" height="600" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl">
              <defs>
                <linearGradient id="metal-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.01)" />
                  <stop offset="50%" stopColor="rgba(255,255,255,0.2)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.01)" />
                </linearGradient>
                <linearGradient id="glow-sweep" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#D95E46" stopOpacity="0" />
                  <stop offset="50%" stopColor="#D95E46" stopOpacity="1" />
                  <stop offset="100%" stopColor="#D95E46" stopOpacity="0" />
                </linearGradient>
                <filter id="neon-glow">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Concentric Metal Rings with Multi-layered Animations */}
              {[
                { r: 240, duration: 120, direction: 1, opacity: 0.15, dash: "2 12" },
                { r: 180, duration: 100, direction: -1, opacity: 0.1, dash: "1 15" },
                { r: 120, duration: 80, direction: 1, opacity: 0.2, dash: "4 8" },
              ].map((ring, i) => (
                <g key={i} style={{ transformOrigin: '300px 300px' }}>
                  {/* The Base Metal Ring */}
                  <motion.circle 
                    cx="300" cy="300" r={ring.r} 
                    stroke="url(#metal-gradient)" 
                    strokeWidth="1.5" 
                    strokeDasharray={ring.dash}
                    opacity={ring.opacity}
                    animate={{ rotate: ring.direction * 360 }}
                    transition={{ duration: ring.duration, repeat: Infinity, ease: "linear" }}
                  />

                  {/* High-Speed Reflection Sweep - Now significantly slowed down */}
                  <motion.circle
                    cx="300" cy="300" r={ring.r}
                    stroke="url(#glow-sweep)"
                    strokeWidth="2"
                    strokeDasharray="40 300"
                    strokeLinecap="round"
                    filter="url(#neon-glow)"
                    animate={{ rotate: ring.direction * 360 * 2 }}
                    transition={{ duration: ring.duration / 2, repeat: Infinity, ease: "linear" }}
                    opacity={0.3}
                  />

                  {/* Data Node Cluster */}
                  <motion.g
                    animate={{ rotate: ring.direction * 360 }}
                    transition={{ duration: ring.duration * 2, repeat: Infinity, ease: "linear" }}
                    style={{ transformOrigin: '300px 300px' }}
                  >
                    <motion.circle
                      cx={300 + ring.r} cy="300" r="5"
                      fill={i === 0 ? "#D95E46" : "white"}
                      style={{ filter: `blur(${i === 0 ? '1.5px' : '0px'})`, boxShadow: `0 0 15px ${i === 0 ? '#D95E46' : '#fff'}` }}
                      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 4 + i, repeat: Infinity }}
                    />
                    {/* Trailing Arc */}
                    <path 
                      d={`M ${300 + ring.r} 300 A ${ring.r} ${ring.r} 0 0 1 ${300 + ring.r - 30} ${300 - 30}`}
                      stroke={i === 0 ? "#D95E46" : "white"}
                      strokeWidth="1.5"
                      opacity="0.15"
                      fill="none"
                    />
                  </motion.g>
                </g>
              ))}

              {/* Reactor Core Housing */}
              <g filter="url(#neon-glow)">
                <circle cx="300" cy="300" r={65} stroke="#D95E46" strokeOpacity="0.1" strokeWidth="0.5" />
                <motion.circle 
                   cx="300" cy="300" r={45} 
                   stroke="#D95E46" 
                   strokeWidth="1.5" 
                   strokeDasharray="5 5"
                   animate={{ rotate: 360, scale: [0.98, 1.02, 0.98] }}
                   transition={{ rotate: { duration: 20, repeat: Infinity, ease: "linear" }, scale: { duration: 6, repeat: Infinity, ease: "easeInOut" } }}
                   style={{ transformOrigin: '300px 300px' }}
                />
              </g>

              {/* Intermittent Data Bursts (Unique Arcs) */}
              {[0, 120, 240].map((angle, idx) => (
                <motion.path
                  key={`burst-${idx}`}
                  d="M300 100 A 200 200 0 0 1 450 250"
                  stroke="#D95E46"
                  strokeWidth="1"
                  strokeDasharray="2 10"
                  opacity="0"
                  animate={{ opacity: [0, 0.3, 0], pathLength: [0, 1] }}
                  transition={{ duration: 8, repeat: Infinity, delay: idx * 3 }}
                  style={{ transformOrigin: '300px 300px', transform: `rotate(${angle}deg)` }}
                />
              ))}
            </svg>

            {/* Core Neural Node */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
               <motion.div 
                 animate={{ scale: [1, 1.2, 1], boxShadow: ["0 0 20px rgba(255,255,255,0.2)", "0 0 40px rgba(217,94,70,0.4)", "0 0 20px rgba(255,255,255,0.2)"] }}
                 transition={{ duration: 4, repeat: Infinity }}
                 className="h-2 w-2 rounded-full bg-white relative z-20" 
               />
               <motion.div 
                 animate={{ scale: [1, 3, 1], opacity: [0.3, 0, 0.3] }}
                 transition={{ duration: 3, repeat: Infinity }}
                 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 rounded-full border border-[#D95E46]/30" 
               />
            </div>
          </div>
        </div>

        {/* Professional Copy Overlay */}
        <div className="absolute bottom-16 left-12 lg:left-16 space-y-6 z-50 max-w-md">
          <div className="space-y-2">
             <div className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-[#D95E46] shadow-[0_0_8px_#D95E46]" />
                <span className="text-[10px] font-bold text-[#D95E46] uppercase tracking-widest">Platform Core</span>
             </div>
              <h3 className="text-4xl lg:text-5xl font-semibold text-white tracking-tight max-w-md leading-[1.1]">AI agents for <br/> your business.</h3>
          </div>
          <p className="text-gray-500 font-medium text-lg max-w-md leading-relaxed">Connect WhatsApp, email, and web chat — one inbox for all customer conversations.</p>
          
          <div className="flex gap-2 pt-8">
            <div className="h-0.5 w-8 bg-white opacity-40" />
            <div className="h-0.5 w-8 bg-white opacity-10" />
            <div className="h-0.5 w-8 bg-white opacity-10" />
          </div>
        </div>
      </div>
    </div>
  )
}
