"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"

export type View = 'landing' | 'onboarding' | 'dashboard-inbox' | 'dashboard-settings'

export function useFlowCoreRouter() {
  const [currentView, setCurrentView] = useState<View>('landing')
  const [showToast, setShowToast] = useState(false)
  const { setTheme } = useTheme()

  // Sync theme with view
  useEffect(() => {
    if (currentView === 'landing' || currentView === 'onboarding') {
      setTheme('dark')
    } else {
      setTheme('light')
    }
  }, [currentView, setTheme])

  const triggerToast = () => {
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const navigateTo = (view: View) => {
    setCurrentView(view)
  }

  return {
    currentView,
    showToast,
    navigateTo,
    triggerToast
  }
}
