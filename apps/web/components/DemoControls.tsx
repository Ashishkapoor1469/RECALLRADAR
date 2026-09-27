'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '../lib/api';

export default function DemoControls() {
  const [scanning, setScanning] = useState(false);
  const [dbStatus, setDbStatus] = useState<{
    engine: string;
    isConnected: boolean;
  }>({
    engine: 'PostgreSQL',
    isConnected: true,
  });

  useEffect(() => {
    fetch(getApiUrl('/api/v1/system/status'))
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setDbStatus({
            engine: data.database_engine || data.db_engine || 'PostgreSQL',
            isConnected: data.is_connected !== false,
          });
        }
      })
      .catch(() => {
        setDbStatus({ engine: 'Disconnected', isConnected: false });
      });
  }, []);

  const handleRescan = () => {
    setScanning(true);
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  return (
    <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
      <span
        className={`hidden sm:inline-flex px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold rounded-xl border items-center gap-1.5 whitespace-nowrap ${
          dbStatus.isConnected
            ? dbStatus.engine.includes('Postgre')
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-indigo-50 text-indigo-800 border-indigo-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${
            dbStatus.isConnected
              ? dbStatus.engine.includes('Postgre')
                ? 'bg-emerald-500'
                : 'bg-indigo-500'
              : 'bg-rose-500'
          }`}
        ></span>
        {dbStatus.isConnected ? `${dbStatus.engine} (Live)` : 'DB Disconnected'}
      </span>
      <button
        onClick={handleRescan}
        disabled={scanning}
        className="px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl border border-slate-200 transition flex items-center gap-1.5 whitespace-nowrap disabled:opacity-60"
        title="Rescan Telemetry"
      >
        <svg
          className={`w-3.5 h-3.5 text-slate-500 shrink-0 ${scanning ? 'animate-spin text-brand-600' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          ></path>
        </svg>
        <span className="hidden sm:inline">{scanning ? 'Scanning...' : 'Rescan Telemetry'}</span>
        <span className="sm:hidden">{scanning ? 'Scanning...' : 'Rescan'}</span>
      </button>
    </div>
  );
}
