export default function Loading() {
  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-44 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-4 w-72 bg-gray-100 rounded-lg animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-gray-100 rounded-xl animate-pulse" />
      </div>

      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-6 rounded-2xl border border-gray-100 bg-white flex items-center gap-5">
            <div className="h-10 w-10 rounded-xl bg-gray-100 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
              <div className="h-6 w-6 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
