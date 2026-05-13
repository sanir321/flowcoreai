"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

type ConsentLevel = "accepted" | "rejected" | null

const STORAGE_KEY = "flowcore_cookie_consent"

export function CookieConsent() {
  const [consent, setConsent] = useState<ConsentLevel>(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      setShowBanner(true)
    } else {
      setConsent(stored as ConsentLevel)
    }
  }, [])

  function handleAccept() {
    localStorage.setItem(STORAGE_KEY, "accepted")
    setConsent("accepted")
    setShowBanner(false)
  }

  function handleReject() {
    localStorage.setItem(STORAGE_KEY, "rejected")
    setConsent("rejected")
    setShowBanner(false)
  }

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            maxWidth: 640,
            width: "calc(100% - 48px)",
            background: "#141414",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: 20,
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          <p style={{
            color: "#c0c0c0",
            fontSize: 13,
            lineHeight: 1.6,
            margin: "0 0 16px",
          }}>
            We use essential cookies for authentication and optional cookies to improve your experience.{" "}
            <Link href="/legal/cookie-policy" style={{ color: "#c65f39", textDecoration: "underline" }}>
              Learn more
            </Link>
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              onClick={handleReject}
              style={{
                padding: "8px 20px",
                borderRadius: 100,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "transparent",
                color: "#999",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Reject All
            </button>
            <button
              onClick={handleAccept}
              style={{
                padding: "8px 20px",
                borderRadius: 100,
                border: "none",
                background: "#c65f39",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Accept All
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
