'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { getApiUrl } from '../../lib/api';

interface QueueItem {
  id: string;
  name: string;
  brand: string;
  category: string;
  risk_score: number;
  trend: string;
  confidence: string;
  signal_count: number;
  latest_signal: string;
  recall_status: string;
  lead_time_weeks: number | null;
}

function RiskQueueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageParam = parseInt(searchParams?.get('page') || '1', 10);

  const [items, setItems] = useState<QueueItem[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(pageParam);

  const [loading, setLoading] = useState(true);
  const [minRisk, setMinRisk] = useState<number>(0);
  const [category, setCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('highest_risk');

  useEffect(() => {
    fetchQueueData(page, minRisk, category, sortBy);
  }, [page, minRisk, category, sortBy]);

  const fetchQueueData = async (
    pageNum: number,
    riskVal: number,
    catVal: string,
    sortVal: string
  ) => {
    setLoading(true);
    try {
      let url = getApiUrl(`/api/v1/risk-queue/?page=${pageNum}&page_size=10&sort_by=${sortVal}&min_risk=${riskVal}`);
      if (catVal) url += `&category=${encodeURIComponent(catVal)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotalItems(data.total || 0);
        setTotalPages(data.total_pages || 1);
      }
    } catch (e) {
      console.error('Error fetching risk queue data:', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      router.push(`/risk-queue?page=${newPage}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Live Risk Queue &amp; Citation Diagnostics
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
              {totalItems} Products In DB Queue
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1 font-medium">
            Ranked by Bayesian harm probability, linguistic clustering severity, and review signal velocity.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="text-slate-500">Page {page} of {totalPages}</span>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-card flex flex-wrap items-center gap-5 text-xs font-semibold text-slate-700">
        <div>
          <label className="text-slate-500 block mb-1 text-[11px] font-bold uppercase tracking-wider">
            Minimum Risk Score
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={minRisk}
            onChange={(e) => {
              setMinRisk(Number(e.target.value));
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-900 font-bold w-28 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div>
          <label className="text-slate-500 block mb-1 text-[11px] font-bold uppercase tracking-wider">
            Category Filter
          </label>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="">All Categories</option>
            <option value="Musical Instruments">Musical Instruments</option>
            <option value="Cables & Accessories">Cables &amp; Accessories</option>
            <option value="Amplifiers & Effects">Amplifiers &amp; Effects</option>
          </select>
        </div>

        <div>
          <label className="text-slate-500 block mb-1 text-[11px] font-bold uppercase tracking-wider">
            Sort Order
          </label>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="highest_risk">Highest Hazard Index</option>
            <option value="most_signals">Most Safety Signals</option>
            <option value="largest_lead_time">Largest Lead Time</option>
          </select>
        </div>
      </div>

      {/* Pagination Header Bar */}
      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-600">
        <div>
          Showing <strong>{items.length === 0 ? 0 : (page - 1) * 10 + 1}</strong>–<strong>{Math.min(page * 10, totalItems)}</strong> of <strong>{totalItems}</strong> matching products
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 transition"
          >
            &larr; Previous
          </button>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 transition"
          >
            Next &rarr;
          </button>
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-card animate-pulse space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="w-20 h-4 bg-slate-200 rounded-md"></div>
                  <div className="w-3/4 h-5 bg-slate-200 rounded-md"></div>
                  <div className="w-1/2 h-3 bg-slate-100 rounded-md"></div>
                </div>
                <div className="w-14 h-14 bg-slate-200 rounded-2xl shrink-0"></div>
              </div>
              <div className="w-full h-16 bg-slate-100 rounded-xl"></div>
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200/80 text-center">
            <h3 className="text-base font-bold text-slate-900">Not enough data yet</h3>
            <p className="text-xs text-slate-500 mt-1">No products match your active risk filters.</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-card hover:shadow-card-hover transition relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <span className={`inline-block text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                      item.risk_score >= 50
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : item.risk_score >= 30
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {item.risk_score >= 50 ? 'CRITICAL RISK' : item.risk_score >= 30 ? 'ELEVATED RISK' : 'LOW RISK'}
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-900 mt-2 leading-snug tracking-tight line-clamp-2" title={item.name}>
                      {item.name}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 mt-1 truncate">
                      Brand: {item.brand} | ASIN: {item.id}
                    </p>
                  </div>

                  <div className={`min-w-[58px] h-14 px-2 rounded-2xl flex flex-col items-center justify-center font-black text-white shadow-sm shrink-0 ${
                    item.risk_score >= 50 ? 'bg-rose-600 shadow-rose-600/25' : item.risk_score >= 30 ? 'bg-amber-500 shadow-amber-500/25' : 'bg-emerald-600'
                  }`}>
                    <span className="text-lg font-black leading-none tracking-tight">{item.risk_score.toFixed(1)}</span>
                    <span className="text-[8px] font-bold uppercase tracking-tighter opacity-95 mt-0.5 whitespace-nowrap">Risk Index</span>
                  </div>
                </div>

                <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-100 mb-4">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                    <span className="text-rose-500 font-bold">⚠</span> Signal Cluster:
                  </div>
                  <p className="text-xs text-slate-700 italic font-medium leading-relaxed line-clamp-2">
                    "{item.latest_signal}"
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Verified Signals</span>
                    <span className="font-extrabold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200/60">
                      {item.signal_count} safety signals
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Lead Window</span>
                    <span className="text-xs font-extrabold text-emerald-700">
                      {item.lead_time_weeks ? `${item.lead_time_weeks} wks early` : 'N/A'}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Status</span>
                    <span className="text-xs font-extrabold text-slate-700">{item.recall_status}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium font-mono">ASIN: {item.id}</span>
                <Link
                  href={`/products/${item.id}`}
                  className="font-bold text-brand-700 hover:text-brand-800 flex items-center gap-1 group"
                >
                  <span>Inspect Product</span>
                  <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Pagination Controls */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm text-xs font-semibold">
        <div className="text-slate-500">
          Showing <strong>{items.length === 0 ? 0 : (page - 1) * 10 + 1}</strong> to <strong>{Math.min(page * 10, totalItems)}</strong> of <strong>{totalItems}</strong> items
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition"
          >
            &larr; Previous Page
          </button>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition"
          >
            Next Page &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RiskQueuePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Risk Queue...</div>}>
      <RiskQueueContent />
    </Suspense>
  );
}
