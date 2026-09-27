export default function GlobalLoading() {
  return (
    <div className="w-full space-y-6 animate-pulse py-6">
      {/* Top Banner Skeleton */}
      <div className="h-20 bg-slate-200/80 rounded-2xl w-full"></div>

      {/* KPI Cards Row Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-white border border-slate-200/60 rounded-2xl p-5 space-y-3">
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            <div className="h-8 bg-slate-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>

      {/* Main Content Panels Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 h-96 bg-white border border-slate-200/60 rounded-2xl p-6 space-y-4">
          <div className="h-5 bg-slate-200 rounded w-1/3"></div>
          <div className="h-64 bg-slate-100 rounded-xl"></div>
        </div>
        <div className="lg:col-span-4 h-96 bg-white border border-slate-200/60 rounded-2xl p-6 space-y-4">
          <div className="h-5 bg-slate-200 rounded w-1/2"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
