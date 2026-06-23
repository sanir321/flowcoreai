import { Skeleton } from "@/components/ui/skeleton"

export default function OrdersLoading() {
  return (
    <div className="p-4 md:p-6 max-w-full font-sans pb-24 animate-in fade-in duration-500">
      {}
      <div className="flex items-center gap-3 mb-8">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-20 rounded-lg" />
          <Skeleton className="h-3 w-56 rounded" />
        </div>
      </div>

      {}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm space-y-2">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-7 w-12 rounded" />
          </div>
        ))}
      </div>

      {}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-1 p-1 rounded-xl">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-7 w-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-9 w-56 rounded-xl" />
      </div>

      {}
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-48 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-14 rounded" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
