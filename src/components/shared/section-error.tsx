"use client"

export function SectionError({ error, reset, label = "section" }: {
  error: Error & { digest?: string }
  reset: () => void
  label?: string
}) {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="text-center space-y-4 max-w-sm">
        <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto">
          <span className="text-red-500 text-lg">!</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">This {label} ran into a problem</h2>
        <p className="text-sm text-gray-500">{error.message || "An unexpected error occurred"}</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
