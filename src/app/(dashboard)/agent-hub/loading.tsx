export default function AgentHubLoading() {
  return (
    <div className="h-full flex overflow-hidden bg-white animate-in fade-in duration-500">
      {/* Sidebar skeleton */}
      <div className="w-64 border-r border-gray-100 p-6 space-y-6">
        <div className="h-5 w-24 bg-gray-100 rounded-lg animate-pulse" />
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 w-full bg-gray-50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>

      <div className="flex-1 p-12 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="min-h-[420px] w-full max-w-[340px] rounded-[2.5rem] border border-gray-100 bg-gray-50 p-6 md:p-10 flex flex-col items-center text-center space-y-8">
              <div className="h-16 w-16 rounded-full bg-gray-200 animate-pulse" />
              <div className="space-y-3 w-full">
                <div className="h-5 w-32 bg-gray-200 rounded-lg animate-pulse mx-auto" />
                <div className="h-3 w-44 bg-gray-100 rounded animate-pulse mx-auto" />
              </div>
              <div className="mt-auto pt-8 border-t border-gray-100 w-full space-y-3">
                <div className="h-3 w-20 bg-gray-100 rounded animate-pulse mx-auto" />
                <div className="h-8 w-full bg-gray-200 rounded-xl animate-pulse" />
              </div>
            </div>
          ))}

          {/* Add Agent skeleton */}
          <div className="min-h-[420px] w-full max-w-[340px] rounded-[2.5rem] border-2 border-dashed border-gray-100 p-6 md:p-10 flex flex-col items-center justify-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-gray-100 animate-pulse" />
            <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
