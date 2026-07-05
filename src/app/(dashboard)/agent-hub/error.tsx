"use client"
import { SectionError } from "@/components/shared/section-error"

export default function AgentHubError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <SectionError {...props} label="agent hub" />
}
