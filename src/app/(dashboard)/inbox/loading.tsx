export default function InboxLoading() {
  return (
    <div className="flex-1 flex overflow-hidden font-sans animate-in fade-in duration-500">
      {/* Session List Skeleton */}
      <div className="w-96 border-r border-gray-100 flex flex-col bg-white shrink-0 z-20">
        <div className="p-8 space-y-6">
          <div className="flex items-end justify-between">
            <div className="space-y-2">
              <div className="h-7 w-16 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-5 w-8 bg-gray-100 rounded-lg animate-pulse" />
          </div>
          <div className="h-10 w-full bg-gray-50 rounded-xl animate-pulse" />
        </div>

        <div className="h-14 border-b border-gray-100 flex items-center px-8 gap-8 bg-white">
          <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-10 bg-gray-100 rounded animate-pulse" />
        </div>

        <div className="flex-1 divide-y divide-gray-50">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="px-8 py-5 flex flex-col justify-center gap-2">
              <div className="flex justify-between items-center">
                <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-12 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-14 bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-4 w-12 bg-gray-100 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area Skeleton */}
      <div className="flex-1 flex flex-col bg-white relative">
        <div className="h-20 px-10 border-b border-gray-50 flex items-center justify-between bg-white">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-gray-100 animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-20 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-8 w-8 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </div>

        <div className="flex-1 p-10 space-y-6">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex justify-start">
              <div className="space-y-3">
                <div className="h-10 w-64 bg-gray-50 rounded-2xl rounded-tl-none animate-pulse" />
                <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
            <div className="flex justify-end">
              <div className="space-y-3">
                <div className="h-8 w-48 bg-gray-50 rounded-2xl rounded-tr-none animate-pulse" />
                <div className="h-3 w-16 bg-gray-100 rounded animate-pulse ml-auto" />
              </div>
            </div>
            <div className="flex justify-start">
              <div className="space-y-3">
                <div className="h-16 w-80 bg-gray-50 rounded-2xl rounded-tl-none animate-pulse" />
                <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
            <div className="flex justify-end">
              <div className="space-y-3">
                <div className="h-10 w-40 bg-gray-50 rounded-2xl rounded-tr-none animate-pulse" />
                <div className="h-3 w-16 bg-gray-100 rounded animate-pulse ml-auto" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border-t border-gray-50">
          <div className="max-w-3xl mx-auto">
            <div className="h-12 w-full bg-gray-50 border border-gray-100 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
