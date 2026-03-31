export default function DashboardLoading() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-6 w-40 bg-gray-200 rounded-lg" />
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-3 w-24 bg-gray-100 rounded" />
          </div>
          <div className="h-6 w-20 bg-gray-100 rounded-full" />
        </div>
      ))}
    </div>
  )
}
