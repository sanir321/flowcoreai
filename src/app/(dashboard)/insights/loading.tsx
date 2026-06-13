import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="p-10 max-w-7xl mx-auto space-y-6 font-sans animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-32 rounded-lg" />
          <Skeleton className="h-4 w-48 rounded" />
        </div>
        <Skeleton className="h-6 w-28 rounded-full" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {["MessageSquare", "Users", "Bot", "Shield"].map((_, i) => (
          <div key={i} className="p-5 rounded-2xl border border-gray-100 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-9 w-9 rounded-xl" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-6 w-16 rounded" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 rounded-2xl border border-gray-100 bg-white space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
            <Skeleton className="h-5 w-12 rounded" />
          </div>
        ))}
      </div>

      <div className="p-6 rounded-3xl border border-gray-100 bg-white space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-32 rounded" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-7 w-20 rounded-lg" />
            <Skeleton className="h-7 w-20 rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-[280px] w-full rounded-2xl" />
      </div>
    </div>
  )
}
