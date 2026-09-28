'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '../lib/api';
import { useLiveDataContext } from '../lib/useLiveData';

export default function DemoControls() {
  const [scanning, setScanning] = useState(false);
  const [timeAgo, setTimeAgo] = useState('just now');
  const [dbStatus, setDbStatus] = useState<{
    engine: string;
    isConnected: boolean;
  }>({
    engine: 'PostgreSQL',
    isConnected: true,
  });

  const liveData = useLiveDataContext();
  const status = liveData?.status || 'live';
  const lastUpdated = liveData?.lastUpdated;

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

  // Update "just now" / seconds ago timestamp display every second
  useEffect(() => {
    if (!lastUpdated) return;

    const updateLabel = () => {
      const diffSec = Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 1000);
      if (diffSec < 5) {
        setTimeAgo('just now');
      } else if (diffSec < 60) {
        setTimeAgo(`${diffSec}s ago`);
      } else {
        const diffMin = Math.floor(diffSec / 60);
        setTimeAgo(`${diffMin}m ago`);
      }
    };

    updateLabel();
    const interval = setInterval(updateLabel, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const handleRescan = async () => {
    setScanning(true);
    try {
      if (liveData?.triggerManualRescan) {
        await liveData.triggerManualRescan();
      }
    } finally {
      setTimeout(() => {
        setScanning(false);
      }, 500);
    }
  };

  return (
    <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
      {/* Live / Status Indicator Pill */}
      {status === 'reconnecting' ? (
        <span className="inline-flex px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold rounded-xl border items-center gap-1.5 whitespace-nowrap bg-amber-50 text-amber-800 border-amber-200">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0"></span>
          <span>Reconnecting…</span>
        </span>
      ) : status === 'paused' ? (
        <span className="hidden sm:inline-flex px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded-xl border items-center gap-1.5 whitespace-nowrap bg-slate-100 text-slate-600 border-slate-200">
          <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0"></span>
          <span>Paused</span>
        </span>
      ) : (
        <span className="inline-flex px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold rounded-xl border items-center gap-1.5 whitespace-nowrap bg-emerald-50 text-emerald-800 border-emerald-200">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 motion-reduce:hidden"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Live</span>
          <span className="text-[10px] text-emerald-600/80 font-medium hidden md:inline">
            • Updated {timeAgo}
          </span>
        </span>
      )}

      {/* Manual Rescan Telemetry Button */}
      <button
        onClick={handleRescan}
        disabled={scanning}
        className="px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl border border-slate-200 transition flex items-center gap-1.5 whitespace-nowrap disabled:opacity-60 cursor-pointer"
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

