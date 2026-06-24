"use client"

import { useState, useEffect } from "react"
import { Heart, Inbox, Bot, ShoppingCart, Calendar, TrendingUp, BookOpen, Users, Sparkles, ArrowRight, X, ChevronLeft, ChevronRight } from "lucide-react"
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
    description: "AI agents handle your customer conversations — bookings, support, and sales — automatically.",
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
    description: "Three agents — Booking, Support, Sales — handle conversations end-to-end on autopilot.",
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

export function WelcomeTour() {
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const done = localStorage.getItem(TOUR_KEY)
    if (!done) {
      const timer = setTimeout(() => setShow(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  const dismiss = () => {
    setShow(false)
    localStorage.setItem(TOUR_KEY, "true")
  }

  const next = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep((s) => s + 1)
    } else {
      dismiss()
    }
  }

  const prev = () => {
    if (step > 0) setStep((s) => s - 1)
  }

  const current = TOUR_STEPS[step]
  const Icon = current.icon
  const isFirst = step === 0
  const isLast = step === TOUR_STEPS.length - 1

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-black/10 overflow-hidden"
          >
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={dismiss}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-all"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="p-5 pt-6">
              <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center mb-4 shadow-sm", current.bg)}>
                <Icon className={cn("h-6 w-6", current.color)} />
              </div>

              <h2 className="text-lg font-bold text-gray-900 leading-tight">{current.title}</h2>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">{current.description}</p>
            </div>

            <div className="px-5 pb-5">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex gap-1.5">
                  {TOUR_STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        i === step
                          ? "w-6 bg-[#c65f39]"
                          : "w-1.5 bg-gray-200"
                      )}
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
                    <button
                      onClick={prev}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Back
                    </button>
                  )}
                  {isFirst && <div />}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={dismiss}
                    className="text-xs font-semibold text-gray-400 hover:text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    Skip
                  </button>

                  <button
                    onClick={next}
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
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
