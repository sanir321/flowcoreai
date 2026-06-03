export default function SettingsLoading() {
  return (
    <div className="flex h-full font-sans overflow-hidden">
      <aside className="hidden lg:block w-64 border-r border-gray-100 shrink-0">
        <div className="p-5 border-b border-gray-50">
          <div className="h-5 w-20 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-32 bg-gray-100 rounded animate-pulse mt-2" />
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg">
              <div className="h-4 w-4 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">
          <div className="space-y-2">
            <div className="h-7 w-40 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-4 w-56 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-6 rounded-2xl border border-gray-100 space-y-4">
                <div className="h-5 w-36 bg-gray-100 rounded animate-pulse" />
                <div className="h-10 w-full bg-gray-50 rounded-xl animate-pulse" />
                <div className="h-10 w-full bg-gray-50 rounded-xl animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
