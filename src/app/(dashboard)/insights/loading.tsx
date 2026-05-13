import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-20 space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
      <p className="text-sm text-gray-400 font-medium tracking-tight">Gathering telemetry...</p>
    </div>
  )
}
