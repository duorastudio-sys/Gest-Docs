export default function ClienteLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Back + title */}
      <div className="space-y-2">
        <div className="h-3 w-16 bg-gray-200 rounded" />
        <div className="h-7 w-48 bg-gray-200 rounded-lg" />
      </div>
      {/* Info card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-12 bg-gray-100 rounded" />
            <div className="h-4 w-28 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      {/* Expedientes */}
      {[1, 2].map(i => (
        <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="space-y-1">
              <div className="h-4 w-36 bg-gray-200 rounded" />
              <div className="h-3 w-20 bg-gray-100 rounded" />
            </div>
            <div className="h-7 w-24 bg-gray-100 rounded-full" />
          </div>
          <div className="px-5 py-4 grid grid-cols-2 gap-6">
            <div className="space-y-2">
              {[1, 2].map(j => <div key={j} className="h-4 w-full bg-gray-100 rounded" />)}
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map(j => <div key={j} className="h-4 w-full bg-gray-100 rounded" />)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
