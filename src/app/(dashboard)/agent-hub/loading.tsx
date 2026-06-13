import { Skeleton } from "@/components/ui/skeleton"

export default function AgentHubLoading() {
  return (
    <div className="h-full flex overflow-hidden bg-white animate-in fade-in duration-500">
      <div className="w-64 border-r border-gray-100 p-5 space-y-5 shrink-0">
        <Skeleton className="h-5 w-28 rounded-lg" />
        <div className="space-y-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-3.5 w-20 rounded" />
              <Skeleton className="h-4 w-4 rounded-full ml-auto" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 p-10 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="min-h-[400px] w-full max-w-[340px] rounded-[2.5rem] bg-[#1A1818] p-8 flex flex-col items-center text-center space-y-6">
              <Skeleton className="h-14 w-14 rounded-full bg-white/10" />
              <div className="space-y-2 w-full">
                <Skeleton className="h-5 w-28 rounded-lg mx-auto bg-white/10" />
                <Skeleton className="h-3 w-40 rounded mx-auto bg-white/10" />
              </div>
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-2.5 w-2.5 rounded-full bg-white/10" />
                <Skeleton className="h-3 w-16 rounded bg-white/10" />
              </div>
              <div className="mt-auto pt-6 border-t border-white/10 w-full space-y-3">
                <Skeleton className="h-3 w-12 rounded mx-auto bg-white/10" />
                <Skeleton className="h-9 w-full rounded-xl bg-white/10" />
              </div>
            </div>
          ))}

          <div className="min-h-[400px] w-full max-w-[340px] rounded-[2.5rem] border-2 border-dashed border-gray-200 p-8 flex flex-col items-center justify-center space-y-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 w-24 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}
