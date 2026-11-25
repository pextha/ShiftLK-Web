export default function StorefrontLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-pulse">
      {/* Top progress accent bar */}
      <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
        <div className="h-full w-1/3 bg-brand-neon rounded-full animate-pulse" />
      </div>

      {/* Header skeleton */}
      <div className="space-y-2.5">
        <div className="h-8 w-64 sm:w-96 bg-slate-900 rounded-xl border border-slate-800" />
        <div className="h-4 w-48 sm:w-80 bg-slate-900/60 rounded-lg" />
      </div>

      {/* Content grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-2">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden space-y-3 p-4"
          >
            <div className="aspect-4/3 w-full bg-slate-950 rounded-xl" />
            <div className="h-4 w-2/3 bg-slate-800 rounded-lg" />
            <div className="h-5 w-full bg-slate-800/80 rounded-lg" />
            <div className="h-8 w-1/2 bg-slate-800/60 rounded-xl mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

