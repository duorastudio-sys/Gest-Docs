export default function PortalLoading() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8 pb-16 animate-pulse">
        {/* Header */}
        <div className="mb-8 space-y-2">
          <div className="h-3 w-32 bg-gray-200 rounded" />
          <div className="h-7 w-48 bg-gray-300 rounded-lg" />
          <div className="h-4 w-36 bg-gray-200 rounded" />
        </div>
        {/* Pending list */}
        <div className="mb-8 space-y-2">
          <div className="h-3 w-24 bg-gray-200 rounded mb-3" />
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-xl px-4 py-3 border border-gray-200 h-12" />
          ))}
        </div>
        {/* Upload zone */}
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 h-36 mb-8" />
      </div>
    </main>
  )
}
