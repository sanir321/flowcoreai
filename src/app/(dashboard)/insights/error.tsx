"use client"
import { SectionError } from "@/components/shared/section-error"

export default function InsightsError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <SectionError {...props} label="insights" />
}
