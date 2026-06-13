import { Skeleton } from "@/components/ui/skeleton"

export default function InboxLoading() {
  return (
    <div className="flex-1 flex overflow-hidden font-sans animate-in fade-in duration-500">
      <div className="w-96 border-r border-gray-100 flex flex-col bg-white shrink-0 z-20">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded" />
              <div className="space-y-1.5">
                <Skeleton className="h-6 w-16 rounded-lg" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
          </div>
          <div className="relative">
            <Skeleton className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 rounded" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>

        <div className="h-12 border-b border-gray-100 flex items-center px-6 gap-6 bg-white">
          {["todo", "handling", "done"].map((tab) => (
            <div key={tab} className="flex items-center gap-1.5">
              <Skeleton className="h-3.5 w-3.5 rounded" />
              <Skeleton className="h-3.5 w-14 rounded" />
            </div>
          ))}
        </div>

        <div className="flex-1 divide-y divide-gray-50">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="px-6 py-4 flex flex-col justify-center gap-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-3 w-10 rounded" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-16 rounded-full" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white relative">
        <div className="h-16 px-8 border-b border-gray-50 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-3 w-14 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-8 w-20 rounded-xl" />
            <Skeleton className="h-5 w-5 rounded" />
          </div>
        </div>

        <div className="flex-1 p-8 space-y-6">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex justify-start">
              <div className="space-y-2">
                <Skeleton className="h-10 w-64 rounded-2xl rounded-tl-none" />
                <Skeleton className="h-3 w-14 rounded" />
              </div>
            </div>
            <div className="flex justify-end">
              <div className="space-y-2">
                <Skeleton className="h-8 w-48 rounded-2xl rounded-tr-none" />
                <Skeleton className="h-3 w-14 rounded ml-auto" />
              </div>
            </div>
            <div className="flex justify-start">
              <div className="space-y-2">
                <Skeleton className="h-14 w-80 rounded-2xl rounded-tl-none" />
                <Skeleton className="h-3 w-14 rounded" />
              </div>
            </div>
            <div className="flex justify-end">
              <div className="space-y-2">
                <Skeleton className="h-10 w-40 rounded-2xl rounded-tr-none" />
                <Skeleton className="h-3 w-14 rounded ml-auto" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border-t border-gray-50">
          <div className="max-w-3xl mx-auto relative">
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}
