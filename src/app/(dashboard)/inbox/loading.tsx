export default function InboxLoading() {
  return (
    <div className="h-[calc(100vh-160px)] flex glass-dark rounded-3xl border border-white/5 overflow-hidden animate-in fade-in duration-500">
      {/* Session Sidebar Skeleton */}
      <div className="w-80 border-r border-white/5 flex flex-col bg-neutral-900/20">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-6 w-24 bg-neutral-800 rounded-lg animate-pulse" />
            <div className="h-8 w-8 bg-neutral-800 rounded-lg animate-pulse" />
          </div>
          <div className="h-9 w-full bg-neutral-800 rounded-lg animate-pulse" />
          <div className="flex gap-1 p-1 bg-neutral-950/50 rounded-lg border border-neutral-800">
            <div className="h-7 flex-1 bg-neutral-800 rounded-md animate-pulse" />
            <div className="h-7 flex-1 bg-transparent rounded-md" />
          </div>
        </div>

        <div className="flex-1 p-2 space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-3 rounded-2xl border border-transparent flex gap-3">
              <div className="h-10 w-10 rounded-full bg-neutral-800 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="flex justify-between">
                  <div className="h-3 w-20 bg-neutral-800 rounded animate-pulse" />
                  <div className="h-2 w-8 bg-neutral-800 rounded animate-pulse" />
                </div>
                <div className="h-2 w-full bg-neutral-800 rounded animate-pulse" />
                <div className="h-3 w-12 bg-neutral-800 rounded-full animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area Skeleton */}
      <div className="flex-1 flex flex-col bg-neutral-950/20">
        <div className="h-16 px-6 border-b border-white/5 flex items-center justify-between bg-neutral-950/40">
          <div className="flex items-center gap-4">
            <div className="h-9 w-9 rounded-full bg-neutral-800 animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-3 w-24 bg-neutral-800 rounded animate-pulse" />
              <div className="h-2 w-16 bg-neutral-800 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-20 bg-neutral-800 rounded-lg animate-pulse" />
            <div className="h-8 w-8 bg-neutral-800 rounded-lg animate-pulse" />
          </div>
        </div>

        <div className="flex-1 p-6 space-y-6">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex justify-start">
              <div className="h-12 w-64 bg-neutral-800 rounded-2xl animate-pulse" />
            </div>
            <div className="flex justify-end">
              <div className="h-10 w-48 bg-neutral-800/60 rounded-2xl animate-pulse" />
            </div>
            <div className="flex justify-start">
              <div className="h-20 w-80 bg-neutral-800 rounded-2xl animate-pulse" />
            </div>
            <div className="flex justify-end">
              <div className="h-12 w-32 bg-neutral-800/60 rounded-2xl animate-pulse" />
            </div>
          </div>
        </div>

        <div className="p-4 bg-neutral-950/40 border-t border-white/5">
          <div className="max-w-3xl mx-auto">
            <div className="h-12 w-full bg-neutral-900 border border-neutral-800 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
