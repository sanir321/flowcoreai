export default function AgentHubLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <div className="h-9 w-48 bg-neutral-800 rounded-lg animate-pulse" />
        <div className="h-4 w-96 bg-neutral-800/60 rounded-lg animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-2xl bg-neutral-900 border border-neutral-800 p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-neutral-800 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-neutral-800 rounded animate-pulse" />
                <div className="h-3 w-16 bg-neutral-800/60 rounded-full animate-pulse" />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="h-3 w-full bg-neutral-800/40 rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-neutral-800/40 rounded animate-pulse" />
            </div>

            <div className="pt-4 border-t border-white/5 flex justify-between items-center">
              <div className="flex gap-2">
                <div className="h-4 w-4 rounded bg-neutral-800 animate-pulse" />
                <div className="h-4 w-4 rounded bg-neutral-800 animate-pulse" />
                <div className="h-4 w-4 rounded bg-neutral-800 animate-pulse" />
              </div>
              <div className="h-8 w-24 bg-neutral-800 rounded-xl animate-pulse" />
            </div>
          </div>
        ))}
        
        {/* Add Agent card skeleton */}
        <div className="rounded-2xl border-2 border-dashed border-neutral-800 p-6 flex flex-col items-center justify-center space-y-4">
          <div className="h-10 w-10 rounded-full bg-neutral-800 animate-pulse" />
          <div className="h-4 w-24 bg-neutral-800 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}
