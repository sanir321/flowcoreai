export default function CeoLoading() {
  return (
    <div className="h-full flex font-sans">
      <div className="w-64 border-r border-gray-100 p-4 space-y-2">
        <div className="h-5 w-24 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 w-full bg-gray-50 rounded animate-pulse" />
        <div className="h-4 w-full bg-gray-50 rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-gray-50 rounded animate-pulse" />
      </div>
      <div className="flex-1 flex flex-col p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-gray-100 animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-5 w-28 bg-gray-100 rounded animate-pulse" />
            <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex-1 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
              <div className={`space-y-2 ${i % 2 === 0 ? '' : 'items-end flex flex-col'}`}>
                <div className={`h-4 ${i % 2 === 0 ? 'w-64' : 'w-48'} bg-gray-100 rounded-2xl animate-pulse`} />
                <div className={`h-4 ${i % 2 === 0 ? 'w-48' : 'w-36'} bg-gray-100 rounded-2xl animate-pulse`} />
              </div>
            </div>
          ))}
        </div>
        <div className="h-12 w-full rounded-2xl bg-gray-100 animate-pulse mt-4" />
      </div>
    </div>
  )
}
