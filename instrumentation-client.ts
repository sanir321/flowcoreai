import posthog from "posthog-js"

const key = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN || process.env.NEXT_PUBLIC_POSTHOG_KEY
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com"

if (typeof window !== "undefined" && key) {
  posthog.init(key, {
    api_host: host,
    defaults: "2026-01-30",
  })
}
