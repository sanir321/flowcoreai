export default function AppointmentsLoading() {
  return (
    <div className="flex h-full bg-white font-sans overflow-hidden animate-in fade-in duration-500">
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header Skeleton */}
        <div className="p-8 border-b border-gray-100 bg-white">
          <div className="flex items-end justify-between">
            <div className="space-y-2">
              <div className="h-8 w-40 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-4 w-56 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-32 bg-gray-100 rounded-xl animate-pulse" />
              <div className="h-10 w-10 bg-gray-100 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>

        {/* Calendar + List Skeleton */}
        <div className="flex-1 flex overflow-hidden">
          {/* Calendar Section */}
          <div className="flex-1 p-8 space-y-6">
            <div className="h-10 w-full bg-gray-50 rounded-xl animate-pulse" />
            <div className="grid grid-cols-7 gap-2">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
              ))}
              {[...Array(35)].map((_, i) => (
                <div key={`day-${i}`} className="h-24 bg-gray-50 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>

          {/* Appointments List */}
          <div className="w-80 border-l border-gray-100 p-6 space-y-4">
            <div className="h-5 w-24 bg-gray-100 rounded animate-pulse" />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-xl space-y-2">
                <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
