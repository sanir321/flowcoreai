export default function Loading() {
  return (
    <div className="p-10 max-w-7xl mx-auto space-y-10 font-sans animate-in fade-in duration-500">
      <div className="space-y-2">
        <div className="h-8 w-32 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-4 w-64 bg-gray-100 rounded-lg animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-8 rounded-2xl border border-gray-100 bg-white space-y-6">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-gray-100 animate-pulse" />
              <div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
              <div className="h-7 w-24 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="h-6 w-40 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-64 w-full rounded-3xl bg-gray-50 border border-gray-100 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-6 rounded-2xl border border-gray-100 bg-white space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gray-100 animate-pulse" />
              <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
