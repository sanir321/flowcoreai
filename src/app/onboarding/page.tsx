"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle2
} from "lucide-react"
import { createWorkspace } from "@/app/actions/workspace"
import { finalizeOnboarding } from "@/app/actions/agents"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { INDUSTRY_OPTIONS } from "@/lib/constants"
import { CreateWorkspaceSchema } from "@/lib/schemas/workspace"
import { z } from "zod"

const AGENTS = [
  { 
    id: 'customer_support', 
    name: 'Support Hero', 
    desc: 'Resolves complex technical inquiries & answers customer questions 24/7.', 
    type: 'Customer Success',
    badge: 'Core Agent · Included by Default',
    isCore: true,
  },
  { 
    id: 'appointment_booking', 
    name: 'Appointment Booker', 
    desc: 'Schedule appointments, manage bookings, and send reminders.', 
    type: 'Logistics',
    badge: '+ Adds to Support Hero',
    isCore: false,
  },
  { 
    id: 'sales', 
    name: 'Sales Closer', 
    desc: 'Qualifies incoming leads, pitches services, and books meetings.', 
    type: 'Revenue Growth',
    badge: '+ Adds to Support Hero',
    isCore: false,
  },
]

interface Particle3D {
  x: number
  y: number
  z: number
  baseRadius: number
  angle: number
  speed: number
  orbitTilt: number
  size: number
  color: string
  glowColor: string
  isAccent: boolean
}

function ParticleRing() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const size = 900
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.scale(dpr, dpr)

    const centerX = size / 2
    const centerY = size / 2
    const baseRadius = 240
    const particleCount = 220
    const mouse = { x: -9999, y: -9999, radius: 160 }
    let rotX = 0.25
    let rotY = 0
    let shockwaveRadius = 0
    let shockwaveAlpha = 0

    const particles: Particle3D[] = []
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4
      const orbitTilt = (Math.random() - 0.5) * 0.9
      const radiusOffset = (Math.random() - 0.5) * 90
      const isAccent = Math.random() > 0.65
      const isGold = !isAccent && Math.random() > 0.7

      particles.push({
        x: 0,
        y: 0,
        z: 0,
        baseRadius: baseRadius + radiusOffset,
        angle,
        speed: 0.005 + Math.random() * 0.008,
        orbitTilt,
        size: isAccent ? 1.8 + Math.random() * 1.6 : 1.0 + Math.random() * 1.2,
        color: isAccent 
          ? 'rgba(217, 94, 70, 0.95)' 
          : isGold 
          ? 'rgba(245, 166, 35, 0.85)' 
          : 'rgba(255, 255, 255, 0.75)',
        glowColor: isAccent ? 'rgba(217, 94, 70, 0.6)' : 'rgba(255, 255, 255, 0.3)',
        isAccent,
      })
    }

    let raf = 0
    let t = 0

    const animate = () => {
      ctx.clearRect(0, 0, size, size)
      t += 0.015
      rotY += 0.003

      // Center atmospheric core glow
      const coreGradient = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, 320)
      coreGradient.addColorStop(0, 'rgba(217, 94, 70, 0.08)')
      coreGradient.addColorStop(0.5, 'rgba(217, 94, 70, 0.02)')
      coreGradient.addColorStop(1, 'rgba(31, 26, 26, 0)')
      ctx.fillStyle = coreGradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, 320, 0, Math.PI * 2)
      ctx.fill()

      // Calculate 3D positions with breathing physics & rotation
      const projected: Array<{ p: Particle3D; px: number; py: number; pz: number; scale: number; alpha: number }> = []

      particles.forEach(p => {
        p.angle += p.speed
        const breathe = Math.sin(t * 1.5 + p.angle * 3) * 16
        const currentRadius = p.baseRadius + breathe

        // 3D coordinates on tilted orbital torus
        const ox = Math.cos(p.angle) * currentRadius
        const oy = Math.sin(p.angle) * Math.sin(p.orbitTilt) * (currentRadius * 0.45)
        const oz = Math.sin(p.angle) * Math.cos(p.orbitTilt) * currentRadius

        // Rotate around X and Y axes
        const cosY = Math.cos(rotY)
        const sinY = Math.sin(rotY)
        const cosX = Math.cos(rotX)
        const sinX = Math.sin(rotX)

        const x1 = ox * cosY - oz * sinY
        const z1 = ox * sinY + oz * cosY
        const y2 = oy * cosX - z1 * sinX
        const z2 = oy * sinX + z1 * cosX

        // Interactive mouse displacement in 2D projected space
        let px = centerX + x1
        let py = centerY + y2
        const pz = z2

        const dx = mouse.x - px
        const dy = mouse.y - py
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < mouse.radius && dist > 0) {
          const push = (mouse.radius - dist) / mouse.radius
          px -= (dx / dist) * push * 20
          py -= (dy / dist) * push * 20
        }

        // Perspective depth scale
        const fov = 600
        const scale = fov / (fov + pz * 0.4)
        const alpha = Math.max(0.2, Math.min(1, (pz + 300) / 500))

        projected.push({ p, px, py, pz, scale, alpha })
      })

      // Sort by depth (painter's algorithm)
      projected.sort((a, b) => a.pz - b.pz)

      // Draw constellation lines between nearby particles
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < Math.min(i + 8, projected.length); j++) {
          const p1 = projected[i]
          const p2 = projected[j]
          if (!p1 || !p2) continue
          const dx = p1.px - p2.px
          const dy = p1.py - p2.py
          const distSq = dx * dx + dy * dy

          if (distSq < 3200) { // Distance < ~56px
            const lineAlpha = (1 - distSq / 3200) * 0.18 * ((p1.alpha + p2.alpha) / 2)
            ctx.beginPath()
            ctx.moveTo(p1.px, p1.py)
            ctx.lineTo(p2.px, p2.py)
            ctx.strokeStyle = p1.p.isAccent || p2.p.isAccent
              ? `rgba(217, 94, 70, ${lineAlpha * 1.5})`
              : `rgba(255, 255, 255, ${lineAlpha})`
            ctx.lineWidth = 0.8 * ((p1.scale + p2.scale) / 2)
            ctx.stroke()
          }
        }
      }

      // Draw shockwave ring if active
      if (shockwaveAlpha > 0.01) {
        ctx.beginPath()
        ctx.arc(centerX, centerY, shockwaveRadius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(217, 94, 70, ${shockwaveAlpha * 0.4})`
        ctx.lineWidth = 2
        ctx.stroke()
        shockwaveRadius += 6
        shockwaveAlpha *= 0.94
      }

      // Render glowing 3D particles
      projected.forEach(({ p, px, py, scale, alpha }) => {
        const radius = Math.max(0.6, p.size * scale)
        ctx.save()
        ctx.globalAlpha = alpha

        if (p.isAccent && scale > 0.95) {
          ctx.shadowBlur = 12 * scale
          ctx.shadowColor = p.glowColor
        }

        ctx.beginPath()
        ctx.arc(px, py, radius, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.fill()
        ctx.restore()
      })

      raf = requestAnimationFrame(animate)
    }

    animate()

    const updateMouse = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = (clientX - rect.left) * (size / rect.width)
      mouse.y = (clientY - rect.top) * (size / rect.height)
    }

    const onMove = (e: MouseEvent) => updateMouse(e.clientX, e.clientY)
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) updateMouse(e.touches[0].clientX, e.touches[0].clientY)
    }
    const onLeave = () => {
      mouse.x = -9999
      mouse.y = -9999
    }
    const onClick = () => {
      shockwaveRadius = 20
      shockwaveAlpha = 1
    }

    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('touchmove', onTouchMove, { passive: true })
    canvas.addEventListener('mouseleave', onLeave)
    canvas.addEventListener('touchend', onLeave)
    canvas.addEventListener('click', onClick)

    return () => {
      cancelAnimationFrame(raf)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('mouseleave', onLeave)
      canvas.removeEventListener('touchend', onLeave)
      canvas.removeEventListener('click', onClick)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="w-[900px] h-[900px] max-w-[100vw] max-h-[100vw] select-none"
      style={{ touchAction: 'none' }}
    />
  )
}

export default function OnboardingPage() {
  const [step, setStep] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('onboarding_step')
      return saved ? parseInt(saved, 10) : 1
    }
    return 1
  })
  const [workspaceId, setWorkspaceId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('onboarding_workspace_id')
    }
    return null
  })
  const [selectedAgentIndex, setSelectedAgentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Auth check on mount — redirect if user already has a workspace WITH agents
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push('/login')
        return
      }
      const { data: ws } = await supabase
        .from("workspaces")
        .select("id")
        .eq("owner_id", user.id)
        .is("deleted_at", null)
        .limit(1)
      const workspace = ws?.[0]
      if (workspace) {
        // Check if ACTIVE agents exist — only redirect to inbox if onboarding is complete
        const { data: agents } = await supabase
          .from("workspace_agents")
          .select("id")
          .eq("workspace_id", workspace.id)
          .eq("status", "active")
          .is("deleted_at", null)
          .limit(1)
        if (agents && agents.length > 0) {
          router.push('/inbox')
        } else {
          // If workspace exists but no ACTIVE agents, stay on onboarding to complete setup
          setWorkspaceId(workspace.id)
          setStep(2)
        }
      }
    })
  }, [router])

  // Persist state across refresh
  useEffect(() => {
    if (workspaceId) {
      sessionStorage.setItem('onboarding_workspace_id', workspaceId)
    }
  }, [workspaceId])

  useEffect(() => {
    sessionStorage.setItem('onboarding_step', String(step))
  }, [step])

  const form = useForm({
    resolver: zodResolver(CreateWorkspaceSchema),
    defaultValues: {
      name: "",
      business_type: "",
      employee_count: "",
      website_url: "",
      contact_phone: "",
      accept_terms: false
    }
  })

  const handleCreateWorkspace = async (values: z.infer<typeof CreateWorkspaceSchema>) => {
    setIsLoading(true)
    const result = await createWorkspace(values)
    if (result.error || !result.data) {
      toast.error(result.error || "Failed to create workspace")
      console.error("Workspace creation error:", result.error)
    } else {
      setWorkspaceId(result.data.workspace_id)
      setStep(2)
      toast.success("Workspace created successfully!")
    }
    setIsLoading(false)
  }

  const handleFinalize = async () => {
    if (!workspaceId) {
      toast.error("Workspace not found. Please go back and create a workspace first.")
      return
    }
    const selectedAgent = AGENTS[selectedAgentIndex]
    if (!selectedAgent) return

    const agentTypes = selectedAgent.id === "customer_support"
      ? ["customer_support"]
      : [selectedAgent.id, "customer_support"];

    setIsLoading(true)
    const result = await finalizeOnboarding({
       workspace_id: workspaceId,
       agent_types: agentTypes,
    })
    if (result.error) {
       toast.error(result.error)
    } else {
       toast.success("AI Team Deployed!")
       setStep(3) // Proceed to Particle Animation Step
    }
    setIsLoading(false)
  }

  const handleSkip = async () => {
    if (!workspaceId) {
      toast.error("Workspace not found. Please create a workspace first.")
      return
    }
    setIsLoading(true)
    const result = await finalizeOnboarding({
      workspace_id: workspaceId,
      agent_types: ["customer_support"],
    })
    if (result.error) {
      toast.error(result.error)
    } else {
      setStep(3)
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#1F1A1A] text-white selection:bg-[#D95E46] font-sans flex flex-col items-center justify-center relative overflow-y-auto">
      {/* Global Grainy Noise */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] z-[100] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      <div className={cn(
        "w-full px-6 py-12 transition-all duration-700 relative z-10",
        step === 1 ? "max-w-[500px]" : step === 2 ? "max-w-7xl" : "max-w-full flex-1 flex flex-col items-center justify-center h-full"
      )}>
        {/* Branding - hide on step 3 */}
        {step !== 3 && (
           <div className="text-center font-bold tracking-tighter text-2xl text-white/40 mb-12">Flowcore</div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="text-center space-y-3 text-gray-900">
                <h1 className="text-5xl font-bold tracking-tight text-white">Business Profile</h1>
                <p className="text-neutral-500 font-medium text-lg">Tell us about your company.</p>
              </div>

              <form onSubmit={form.handleSubmit(handleCreateWorkspace)} className="space-y-8">
                <div className="space-y-6">
                  <div className="space-y-2.5 text-left">
                    <Label className="text-[11px] font-bold text-neutral-400 ml-1">Company name <span className="text-[#D95E46]">*</span></Label>
                    <Input 
                      {...form.register("name")}
                      placeholder="Acme"
                      className="h-14 bg-white/5 border-white/10 rounded-xl focus:border-[#D95E46] text-white placeholder:text-neutral-600 transition-all"
                    />
                    {form.formState.errors.name && (
                       <p className="text-red-500 text-[10px] font-bold ml-1 mt-1">{form.formState.errors.name.message as string}</p>
                    )}
                  </div>

                  <div className="space-y-2.5 text-left text-gray-900">
                    <Label className="text-[11px] font-bold text-neutral-400 ml-1">Website URL</Label>
                    <Input 
                      {...form.register("website_url")}
                      placeholder="https://acme.com"
                      className="h-14 bg-white/5 border-white/10 rounded-xl focus:border-[#D95E46] text-white placeholder:text-neutral-600 transition-all"
                    />
                    <p className="text-[10px] text-neutral-500 ml-1">We&apos;ll auto-populate your business profile from your website</p>
                  </div>

                  <div className="space-y-2.5 text-left">
                    <Label className="text-[11px] font-bold text-neutral-400 ml-1">Contact Phone</Label>
                    <Input
                      {...form.register("contact_phone")}
                      placeholder="+91 98765 43210"
                      className="h-14 bg-white/5 border-white/10 rounded-xl focus:border-[#D95E46] text-white placeholder:text-neutral-600 transition-all"
                    />
                    <p className="text-[10px] text-neutral-500 ml-1">Used by your AI agent for appointment confirmations</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6 text-left text-gray-900">
                    <div className="space-y-2.5">
                      <Label className="text-[11px] font-bold text-neutral-400 ml-1">Company size</Label>
                      <Select onValueChange={(val) => form.setValue("employee_count", val)}>
                        <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-xl focus:ring-0 text-white">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1F1A1A] border-white/10 text-white">
                          <SelectItem value="1-10">1-10 employees</SelectItem>
                          <SelectItem value="11-50">11-50 employees</SelectItem>
                          <SelectItem value="51-200">51-200 employees</SelectItem>
                          <SelectItem value="201-500">201-500 employees</SelectItem>
                          <SelectItem value="500+">500+ employees</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.formState.errors.employee_count && (
                       <p className="text-red-500 text-[10px] font-bold ml-1 mt-1">Required</p>
                      )}
                    </div>

                    <div className="space-y-2.5 text-gray-900">
                      <Label className="text-[11px] font-bold text-neutral-400 ml-1">Industry</Label>
                      <Select onValueChange={(val) => form.setValue("business_type", val)}>
                        <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-xl focus:ring-0 text-white">
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                         <SelectContent className="bg-[#1F1A1A] border-white/10 text-white">
                            {INDUSTRY_OPTIONS.map(io => (
                              <SelectItem key={io.value} value={io.value}>{io.label}</SelectItem>
                            ))}
                          </SelectContent>
                      </Select>
                      {form.formState.errors.business_type && (
                       <p className="text-red-500 text-[10px] font-bold ml-1 mt-1">Required</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-left">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox
                      checked={form.watch("accept_terms")}
                      onCheckedChange={(checked) => form.setValue("accept_terms", checked === true, { shouldValidate: true })}
                      className="mt-0.5 border-neutral-500 data-[state=checked]:bg-[#D95E46] data-[state=checked]:border-[#D95E46]"
                    />
                    <span className="text-sm text-neutral-400 leading-relaxed">
                      I accept the{" "}
                      <Link href="/legal/privacy-policy" target="_blank" className="text-[#D95E46] hover:underline font-medium">Privacy Policy</Link>
                      {" "}and{" "}
                      <Link href="/legal/terms" target="_blank" className="text-[#D95E46] hover:underline font-medium">Terms & Conditions</Link>
                    </span>
                  </label>
                  {form.formState.errors.accept_terms && (
                    <p className="text-red-500 text-[10px] font-bold ml-1">{form.formState.errors.accept_terms.message as string}</p>
                  )}
                </div>

                <Button 
                  type="submit"
                  className="w-full h-14 rounded-xl bg-[#D95E46] hover:bg-[#E2735D] text-white font-bold text-sm transition-all active:scale-95 shadow-xl shadow-[#D95E46]/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading || !form.watch("accept_terms")}
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Continue"}
                </Button>
              </form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
               className="flex flex-col items-center gap-8 lg:gap-10 py-4"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center w-full max-w-5xl">
                 <div className="space-y-4 text-center lg:text-left">
                     <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">Your first agent</h2>
                     <p className="text-lg text-neutral-400 font-medium leading-relaxed max-w-sm mx-auto lg:mx-0">
                       <span className="text-white font-semibold">Support Hero</span> is included by default. Choose your team&apos;s primary focus.
                     </p>
                 </div>

                 <div className="relative flex items-center justify-center scale-90 lg:scale-100 origin-center">
                    <button 
                      type="button"
                      aria-label="Previous agent"
                      onClick={() => setSelectedAgentIndex(prev => (prev === 0 ? AGENTS.length - 1 : prev - 1))}
                      className="absolute left-[-20px] lg:left-0 z-20 h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-90"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    
                    <button 
                      type="button"
                      aria-label="Next agent"
                      onClick={() => setSelectedAgentIndex(prev => (prev === AGENTS.length - 1 ? 0 : prev + 1))}
                      className="absolute right-[-20px] lg:right-0 z-20 h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-90"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>

                    <div className="flex gap-8 items-center py-6">
                       <AnimatePresence mode="wait">
                          {(() => {
                            const currentAgent = AGENTS[selectedAgentIndex]
                            if (!currentAgent) return null
                            return (
                              <motion.div
                                key={selectedAgentIndex}
                                initial={{ opacity: 0, scale: 0.9, x: 20 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9, x: -20 }}
                                whileHover={{ 
                                  y: -10, 
                                  scale: 1.02,
                                  boxShadow: "0 20px 40px -10px rgba(217, 94, 70, 0.3)",
                                  borderColor: "rgba(217, 94, 70, 0.5)"
                                }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                onClick={() => setSelectedAgentIndex(prev => (prev === AGENTS.length - 1 ? 0 : prev + 1))}
                                className="w-[300px] lg:w-[340px] h-[440px] bg-[#2D2A2A] rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden group cursor-pointer flex flex-col items-center p-8 text-center transition-colors duration-500 select-none"
                              >
                                 <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                                 
                                 {/* Status / Core Badge */}
                                 <div className={cn(
                                   "px-3 py-1 rounded-full text-[11px] font-semibold mb-4 border transition-all",
                                   currentAgent.isCore 
                                     ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                                     : "bg-[#D95E46]/10 text-[#D95E46] border-[#D95E46]/30"
                                 )}>
                                   {currentAgent.badge}
                                 </div>

                                 <div className="h-14 w-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6 shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]">
                                     <CheckCircle2 className="h-7 w-7 stroke-[2.5]" />
                                 </div>
                                 <div className="space-y-2">
                                    <h3 className="text-2xl font-bold text-white tracking-tight">{currentAgent.name}</h3>
                                    <p className="text-neutral-400 font-medium text-[13px] leading-relaxed">{currentAgent.desc}</p>
                                 </div>
                                 <div className="mt-auto pt-6 border-t border-white/5 w-full flex flex-col items-start gap-1">
                                    <span className="text-[9px] font-bold text-[#D95E46]">Specialization</span>
                                    <span className="text-[11px] font-bold text-white/40 tracking-tight">{currentAgent.type}</span>
                                 </div>
                              </motion.div>
                            )
                          })()}
                       </AnimatePresence>
                    </div>
                 </div>
              </div>

               <div className="w-full max-w-xs space-y-3">
                <Button 
                  onClick={handleFinalize}
                  className="w-full h-12 rounded-xl bg-[#D95E46] hover:bg-[#E2735D] text-white font-bold text-sm transition-all active:scale-95 shadow-xl shadow-[#D95E46]/20"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Launch Assistant"}
                </Button>
                <Button
                  onClick={handleSkip}
                  disabled={isLoading}
                  className="w-full h-10 rounded-xl bg-transparent border border-white/10 hover:bg-white/5 text-neutral-400 hover:text-white font-medium text-xs transition-all"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Skip for now"}
                </Button>
                <div className="flex gap-2 justify-center py-2">
                   {AGENTS.map((agent, i) => (
                     <button
                       key={agent.id}
                       type="button"
                       aria-label={`Select ${agent.name}`}
                       onClick={() => setSelectedAgentIndex(i)}
                       className={cn(
                         "h-2 rounded-full transition-all duration-300 cursor-pointer",
                         selectedAgentIndex === i ? "w-6 bg-white" : "w-2 bg-white/20 hover:bg-white/40"
                       )}
                     />
                   ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-[#1F1A1A] z-50 w-full h-full"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-crosshair">
                 <ParticleRing />
              </div>
              <div className="relative z-10 flex flex-col items-center gap-8 pointer-events-none mt-8">
                 <motion.h2 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.5, duration: 0.8 }}
                   className="text-4xl lg:text-5xl font-medium tracking-tight text-white mix-blend-difference"
                 >
                   Your workspace is ready
                 </motion.h2>
                 <motion.div
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ delay: 1, duration: 0.5 }}
                   className="pointer-events-auto"
                 >
                   <Button 
                     onClick={() => router.push('/inbox')} 
                     className="h-14 px-10 rounded-2xl bg-white text-black hover:bg-neutral-200 font-bold text-base shadow-[0_0_40_px_rgba(255,255,255,0.2)] transition-all active:scale-95"
                   >
                     Start now
                   </Button>
                 </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>


    </div>
  )
}
