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
  { id: 'customer_support', name: 'Support Hero', desc: 'Resolves complex technical inquiries.', type: 'Customer Success' },
  { id: 'appointment_booking', name: 'Appointment Booker', desc: 'Schedule appointments and manage bookings.', type: 'Logistics' },
  { id: 'sales', name: 'Sales Closer', desc: 'Qualifies leads and books meetings.', type: 'Revenue Growth' },
]

interface Particle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  baseTargetX: number;
  baseTargetY: number;
  vx: number;
  vy: number;
  size: number;
  angle: number;
  speed: number;
  color: string;
}

function ParticleRing() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let particles: Particle[] = []
    let animationFrameId: number
    const mouse = { x: -1000, y: -1000, radius: 120 }

    const init = () => {
      canvas.width = 800
      canvas.height = 800
      particles = []
      const numParticles = 1200
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const radius = 250

      for (let i = 0; i < numParticles; i++) {
        const angle = Math.random() * Math.PI * 2
        const r = radius + (Math.random() - 0.5) * 80
        const targetX = centerX + Math.cos(angle) * r
        const targetY = centerY + Math.sin(angle) * r

        particles.push({
          x: centerX + (Math.random() - 0.5) * 1500, // start far away
          y: centerY + (Math.random() - 0.5) * 1500,
          targetX,
          targetY,
          baseTargetX: targetX,
          baseTargetY: targetY,
          vx: 0,
          vy: 0,
          size: Math.random() * 1.5 + 0.5,
          angle: angle,
          speed: Math.random() * 0.01 + 0.005,
          color: Math.random() > 0.8 ? 'rgba(217, 94, 70, 0.6)' : 'rgba(255, 255, 255, 0.3)'
        })
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach(p => {
        // Orbit motion
        p.angle += p.speed
        const r = 250 + Math.sin(p.angle * 3) * 20
        p.baseTargetX = canvas.width / 2 + Math.cos(p.angle) * r
        p.baseTargetY = canvas.height / 2 + Math.sin(p.angle) * r

        const dx = mouse.x - p.x
        const dy = mouse.y - p.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Mouse interaction
        if (distance < mouse.radius) {
          const forceDirectionX = dx / distance
          const forceDirectionY = dy / distance
          const force = (mouse.radius - distance) / mouse.radius
          const directionX = forceDirectionX * force * 15
          const directionY = forceDirectionY * force * 15
          
          p.x -= directionX
          p.y -= directionY
        } else {
          // Return to target
          p.x += (p.baseTargetX - p.x) * 0.05
          p.y += (p.baseTargetY - p.y) * 0.05
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.fill()
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    init()
    animate()

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      // Adjust mouse coordinates based on canvas scale vs internal resolution
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      mouse.x = (e.clientX - rect.left) * scaleX
      mouse.y = (e.clientY - rect.top) * scaleY
    }

    const handleMouseLeave = () => {
      mouse.x = -1000
      mouse.y = -1000
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      cancelAnimationFrame(animationFrameId)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <canvas 
      ref={canvasRef} 
      className="w-[800px] h-[800px] max-w-[100vw] max-h-[100vw]" 
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
        .maybeSingle()
      if (ws) {
        // Check if agents exist — only redirect to inbox if onboarding is complete
        const { data: agents } = await supabase
          .from("workspace_agents")
          .select("id")
          .eq("workspace_id", ws.id)
          .is("deleted_at", null)
          .limit(1)
        if (agents && agents.length > 0) {
          router.push('/inbox')
        }
        // If workspace exists but no agents, stay on onboarding to complete setup
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
      // No workspace created yet — just advance (shouldn't happen in normal flow)
      setStep(3)
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
           <div className="text-center font-bold tracking-tighter text-2xl text-white/40 mb-12">flowcore</div>
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
                 <div className="space-y-4 text-center lg:text-left text-gray-900">
                     <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">Your first agent</h2>
                     <p className="text-lg text-neutral-500 font-medium leading-relaxed max-w-sm mx-auto lg:mx-0">Choose the primary objective for your AI employee.</p>
                 </div>

                 <div className="relative flex items-center justify-center scale-90 lg:scale-100 origin-center text-gray-900">
                    <button 
                      onClick={() => setSelectedAgentIndex(prev => Math.max(0, prev - 1))}
                      className="absolute left-[-20px] lg:left-0 z-20 h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-90"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    
                    <button 
                      onClick={() => setSelectedAgentIndex(prev => Math.min(AGENTS.length - 1, prev + 1))}
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
                                 className="w-[300px] lg:w-[340px] h-[440px] bg-[#2D2A2A] rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden group cursor-pointer flex flex-col items-center p-10 text-center transition-colors duration-500"
                              >
                                 <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                                 <div className="h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-8 shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]">
                                     <CheckCircle2 className="h-8 w-8 stroke-[2.5]" />
                                 </div>
                                 <div className="space-y-3">
                                    <h3 className="text-2xl font-bold text-white tracking-tight">{currentAgent.name}</h3>
                                    <p className="text-neutral-400 font-medium text-[14px] leading-relaxed">{currentAgent.desc}</p>
                                 </div>
                                 <div className="mt-auto pt-8 border-t border-white/5 w-full flex flex-col items-start gap-1">
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
                <div className="flex gap-2 justify-center text-gray-900">
                   {AGENTS.map((_, i) => (
                     <div key={i} className={cn("h-1 w-4 rounded-full transition-all duration-500", selectedAgentIndex === i ? "bg-white" : "bg-white/10")} />
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
