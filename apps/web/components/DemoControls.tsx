'use client';

export default function DemoControls() {
  const handleRescan = () => {
    window.location.reload();
  };

  return (
    <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
      <span className="hidden sm:inline-flex px-2.5 sm:px-3 py-1.5 bg-emerald-50 text-emerald-800 text-[11px] sm:text-xs font-bold rounded-xl border border-emerald-200 items-center gap-1.5 whitespace-nowrap">
        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
        PostgreSQL Engine DB
      </span>
      <button 
        onClick={handleRescan}
        className="px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl border border-slate-200 transition flex items-center gap-1.5 whitespace-nowrap"
        title="Rescan Telemetry"
      >
        <svg className="w-3.5 h-3.5 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
        </svg>
        <span className="hidden sm:inline">Rescan Telemetry</span>
        <span className="sm:hidden">Rescan</span>
      </button>
    </div>
  );
}
