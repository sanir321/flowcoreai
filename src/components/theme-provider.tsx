"use client"

import * as React from "react"

/**
 * Simplified ThemeProvider that doesn't use next-themes
 * This avoids the React 19 script tag warning entirely.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
