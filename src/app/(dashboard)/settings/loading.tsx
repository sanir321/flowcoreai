import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsLoading() {
  return (
    <div className="flex h-full font-sans overflow-hidden animate-in fade-in duration-500">
      <aside className="hidden lg:block w-64 border-r border-gray-100 shrink-0">
        <div className="p-5 border-b border-gray-50">
          <Skeleton className="h-5 w-16 rounded" />
          <Skeleton className="h-3 w-28 rounded mt-1.5" />
        </div>
        <nav className="flex-1 py-4 px-3 space-y-0.5">
          {["Workspace", "Notifications", "Integrations", "Web Widget", "Data & Privacy", "Billing & Credits", "Menu", "Orders"].map((_, i) => (
            <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-3.5 w-28 rounded" />
            </div>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-32 rounded-lg" />
            <Skeleton className="h-4 w-48 rounded" />
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-gray-100 bg-white space-y-5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-36 rounded" />
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-28 rounded" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-24 rounded" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-20 rounded" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              </div>
              <Skeleton className="h-9 w-24 rounded-xl ml-auto" />
            </div>

            <div className="p-6 rounded-2xl border border-red-100 bg-white space-y-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-24 rounded" />
              </div>
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-10 w-36 rounded-xl" />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
