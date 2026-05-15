"use client"

import posthog from "posthog-js"
import { PostHogProvider as PHProvider } from "posthog-js/react"
import { useEffect } from "react"

const key = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com"

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!key) return
    posthog.init(key, {
      api_host: host,
      capture_pageview: true,
      loaded: (ph) => {
        if (process.env.NODE_ENV !== "production") ph.opt_out_capturing()
      },
    })
  }, [])

  if (!key) return <>{children}</>

  return <PHProvider client={posthog}>{children}</PHProvider>
}
