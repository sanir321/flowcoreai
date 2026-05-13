import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
      <p className="text-sm text-gray-500 font-medium tracking-tight">Synchronizing knowledge bank...</p>
    </div>
  )
}
