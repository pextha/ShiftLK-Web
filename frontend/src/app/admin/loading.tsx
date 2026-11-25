export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
        <div className="h-full w-1/3 bg-brand-neon rounded-full" />
      </div>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-56 bg-slate-900 rounded-xl border border-slate-800" />
          <div className="h-3.5 w-72 bg-slate-900/60 rounded-lg" />
        </div>
        <div className="h-9 w-32 bg-slate-900 rounded-xl border border-slate-800" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-slate-900/70 border border-slate-800 p-4"
          />
        ))}
      </div>
      <div className="h-96 rounded-2xl bg-slate-900/70 border border-slate-800" />
    </div>
  );
}

