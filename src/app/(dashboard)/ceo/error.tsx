"use client"
import { SectionError } from "@/components/shared/section-error"

export default function CeoError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <SectionError {...props} label="dashboard" />
}
