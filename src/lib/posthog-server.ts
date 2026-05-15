import { PostHog } from "posthog-node"

const key = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN || process.env.NEXT_PUBLIC_POSTHOG_KEY
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com"

export async function captureEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>,
) {
  if (!key) return
  const client = new PostHog(key, { host })
  client.capture({ distinctId, event, properties })
  await client.shutdown()
}

export async function captureError(
  error: Error,
  context?: Record<string, unknown>,
) {
  if (!key) return
  const client = new PostHog(key, { host })
  client.captureException(error, undefined, { properties: context })
  await client.shutdown()
}
