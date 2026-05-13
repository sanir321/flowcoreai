"use client"

import { motion } from "framer-motion"
import { useReducedMotion } from "framer-motion"

const fadeUp = {
  initial:    { opacity: 0, y: 12 },
  animate:    { opacity: 1, y: 0 },
  exit:       { opacity: 0, y: -8 },
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const shouldReduceMotion = useReducedMotion()
  
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeUp}
      transition={shouldReduceMotion ? { duration: 0 } : { 
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 1
      }}
      className="flex-1 h-full flex flex-col"
    >
      {children}
    </motion.div>
  )
}
