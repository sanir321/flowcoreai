"use client"

import { useState, useEffect } from "react"
import { Heart, Inbox, Bot, ShoppingCart, Calendar, TrendingUp, BookOpen, Sparkles, ArrowRight, X, ChevronLeft, ChevronRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

const TOUR_KEY = "flowcore_tour_completed_v2"

interface TourStep {
  icon: typeof Heart
  title: string
  description: string
  color: string
  bg: string
}

const TOUR_STEPS: TourStep[] = [
  {
    icon: Heart,
    title: "Welcome to FlowCore",
    description: "AI agents handle your customer conversations \u2014 bookings, support, and sales \u2014 automatically.",
    color: "text-[#c65f39]",
    bg: "bg-gradient-to-br from-[#c65f39]/5 to-amber-50",
  },
  {
    icon: Inbox,
    title: "Inbox",
    description: "All WhatsApp and webchat conversations in one unified timeline.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Bot,
    title: "AI Agents",
    description: "Three agents \u2014 Booking, Support, Sales \u2014 handle conversations end-to-end on autopilot.",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    icon: ShoppingCart,
    title: "Orders",
    description: "View orders, verify payments, and update status from a single dashboard.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: Calendar,
    title: "Appointments",
    description: "Bookings auto-sync to your Google Calendar with no manual work.",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: TrendingUp,
    title: "Insights",
    description: "Track conversation volume, agent performance, and customer trends.",
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
  {
    icon: BookOpen,
    title: "Knowledge Base",
    description: "Upload docs, PDFs, or URLs to train your Support agent on your business.",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
]

const FLOWERS = ["🌸", "🌺", "🌷", "🌹"]

function CornerFlowers() {
  return (
    <>
      <motion.span
        className="absolute -top-2 -left-2 text-xl z-20 select-none"
        animate={{ y: [0, -3, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0 }}
      >
        🌸
      </motion.span>
      <motion.span
        className="absolute -top-2 -right-2 text-xl z-20 select-none"
        animate={{ y: [0, -4, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      >
        🌺
      </motion.span>
      <motion.span
        className="absolute -bottom-2 -left-2 text-xl z-20 select-none"
        animate={{ y: [0, 3, 0], rotate: [0, -3, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        🌷
      </motion.span>
      <motion.span
        className="absolute -bottom-2 -right-2 text-xl z-20 select-none"
        animate={{ y: [0, 4, 0], rotate: [0, 3, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      >
        🌹
      </motion.span>
    </>
  )
}

const springTransition = { type: "spring" as const, stiffness: 200, damping: 20 }
const cardSpring = { type: "spring" as const, stiffness: 180, damping: 22, mass: 1 }

export function WelcomeTour() {
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(0)
  const [confetti, setConfetti] = useState<{ id: number; x: number; delay: number; emoji: string }[]>([])

  const current = TOUR_STEPS[step]!

  useEffect(() => {
    const done = localStorage.getItem(TOUR_KEY)
    if (!done) {
      const timer = setTimeout(() => setShow(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (step === 0 && show) {
      const items = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.8,
        emoji: FLOWERS[i % FLOWERS.length]!,
      }))
      setConfetti(items)
    }
  }, [step, show])

  const dismiss = () => {
    setShow(false)
    localStorage.setItem(TOUR_KEY, "true")
  }

  const goNext = () => {
    if (step < TOUR_STEPS.length - 1) {
      setDirection(1)
      setStep((s) => s + 1)
    } else {
      dismiss()
    }
  }

  const goPrev = () => {
    if (step > 0) {
      setDirection(-1)
      setStep((s) => s - 1)
    }
  }

  const Icon = current.icon
  const isFirst = step === 0
  const isLast = step === TOUR_STEPS.length - 1

  const slideVariants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40, scale: 0.96 }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40, scale: 0.96 }),
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/25 backdrop-blur-sm p-4"
        >
          {step === 0 && confetti.map((c) => (
            <motion.span
              key={c.id}
              className="absolute text-lg select-none pointer-events-none z-10"
              initial={{ y: -40, x: `${c.x}%`, opacity: 0, scale: 0 }}
              animate={{ y: [null, "80vh"], opacity: [0, 1, 0.8, 0], scale: [0, 1, 0.8, 0.3] }}
              transition={{ duration: 2.5, delay: c.delay, ease: "easeOut", repeat: Infinity, repeatDelay: 1 }}
            >
              {c.emoji}
            </motion.span>
          ))}

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={cardSpring}
            className="relative w-full max-w-sm bg-white rounded-2xl border border-gray-200/80 shadow-2xl shadow-black/10 overflow-hidden"
          >
            <CornerFlowers />

            <div className="absolute top-3 right-3 z-20">
              <button
                onClick={dismiss}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-all"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="px-5 pt-5">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                >
                  <motion.div
                    className={cn("h-14 w-14 rounded-2xl flex items-center justify-center mb-4 shadow-sm", current.bg)}
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.05 }}
                  >
                    <Icon className={cn("h-6 w-6", current.color)} />
                  </motion.div>

                  <h2 className="text-lg font-bold text-gray-900 leading-tight">{current.title}</h2>
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed pb-5">{current.description}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="px-5 pb-5">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex gap-1.5">
                  {TOUR_STEPS.map((_, i) => (
                    <motion.div
                      key={i}
                      className={cn(
                        "h-1.5 rounded-full transition-colors duration-300",
                        i === step
                          ? "w-6 bg-[#c65f39]"
                          : "w-1.5 bg-gray-200"
                      )}
                      animate={i === step ? { scale: [1, 1.15, 1] } : {}}
                      transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 2 }}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-gray-400 font-medium">
                  {step + 1} / {TOUR_STEPS.length}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1">
                  {!isFirst && (
                    <motion.button
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={goPrev}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Back
                    </motion.button>
                  )}
                  {isFirst && <div />}
                </div>

                <div className="flex items-center gap-2">
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={dismiss}
                    className="text-xs font-semibold text-gray-400 hover:text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    Skip
                  </motion.button>

                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={goNext}
                    className={cn(
                      "flex items-center gap-1.5 px-4 h-9 rounded-xl text-xs font-bold text-white transition-all shadow-sm",
                      isLast ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20" : "bg-[#c65f39] hover:bg-[#a84d2e] shadow-[#c65f39]/20"
                    )}
                  >
                    {isLast ? (
                      <>Get Started <Sparkles className="h-3.5 w-3.5" /></>
                    ) : isFirst ? (
                      <>Take a Tour <ArrowRight className="h-3.5 w-3.5" /></>
                    ) : (
                      <>Next <ChevronRight className="h-3.5 w-3.5" /></>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
