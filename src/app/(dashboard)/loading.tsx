export default function DashboardLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center p-20">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-10 w-10 rounded-xl bg-gray-100 animate-pulse" />
        <div className="h-4 w-36 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    </div>
  )
}
