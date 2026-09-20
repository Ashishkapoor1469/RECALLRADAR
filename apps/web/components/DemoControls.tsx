'use client';

export default function DemoControls() {
  const handleLoad = () => {
    fetch('http://localhost:8000/api/v1/demo/load', { method: 'POST' })
      .then(() => alert('Demo Dataset Loaded!'))
      .catch(() => alert('Demo load triggered.'));
  };

  const handleReset = () => {
    fetch('http://localhost:8000/api/v1/demo/reset', { method: 'POST' })
      .then(() => alert('Demo State Reset!'))
      .catch(() => alert('Demo reset triggered.'));
  };

  return (
    <div className="flex items-center space-x-2">
      <button 
        onClick={handleLoad}
        className="px-3 py-1.5 bg-brand-700 hover:bg-brand-800 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5"
      >
        <svg className="w-3.5 h-3.5 text-brand-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
        </svg>
        Load Demo Dataset
      </button>
      <button 
        onClick={handleReset}
        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl border border-slate-200 transition"
      >
        Reset Demo
      </button>
    </div>
  );
}
