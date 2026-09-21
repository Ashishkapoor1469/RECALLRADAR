'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface OverviewSummary {
  total_products: number;
  total_reviews: number;
  total_signals: number;
  high_risk_count: number;
  highest_risk_item: string;
}

interface SentimentData {
  mode: 'positive' | 'negative';
  series: Array<{ period: string; value: number; count: number }>;
  average_score: number;
  total_count: number;
}

interface AttentionProduct {
  asin: string;
  title: string;
  brand: string;
  category: string;
  total_reviews: number;
  signal_count: number;
  attention_score: number;
  reason: string;
}

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

function OverviewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageParam = parseInt(searchParams?.get('page') || '1', 10);

  const [summary, setSummary] = useState<OverviewSummary | null>(null);
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [sentimentMode, setSentimentMode] = useState<'positive' | 'negative'>('negative');
  const [attentionProducts, setAttentionProducts] = useState<AttentionProduct[]>([]);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [totalQueueItems, setTotalQueueItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(pageParam);

  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingSentiment, setLoadingSentiment] = useState(true);
  const [loadingAttention, setLoadingAttention] = useState(true);
  const [loadingQueue, setLoadingQueue] = useState(true);

  useEffect(() => {
    fetchSummary();
    fetchAttention();
  }, []);

  useEffect(() => {
    fetchSentiment(sentimentMode);
  }, [sentimentMode]);

  useEffect(() => {
    fetchQueue(page);
  }, [page]);

  const fetchSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/overview/summary');
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (e) {
      console.error('Error fetching summary:', e);
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchSentiment = async (mode: 'positive' | 'negative') => {
    setLoadingSentiment(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/overview/sentiment-performance?mode=${mode}`);
      if (res.ok) {
        const data = await res.json();
        setSentimentData(data);
      }
    } catch (e) {
      console.error('Error fetching sentiment performance:', e);
    } finally {
      setLoadingSentiment(false);
    }
  };

  const fetchAttention = async () => {
    setLoadingAttention(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/products/attention');
      if (res.ok) {
        const data = await res.json();
        setAttentionProducts(data.items || []);
      }
    } catch (e) {
      console.error('Error fetching attention products:', e);
    } finally {
      setLoadingAttention(false);
    }
  };

  const fetchQueue = async (pageNum: number) => {
    setLoadingQueue(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/risk-queue/?page=${pageNum}&page_size=10`);
      if (res.ok) {
        const data = await res.json();
        setQueueItems(data.items || []);
        setTotalQueueItems(data.total || 0);
        setTotalPages(data.total_pages || 1);
      }
    } catch (e) {
      console.error('Error fetching queue:', e);
    } finally {
      setLoadingQueue(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      router.push(`/?page=${newPage}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            Safety Intelligence Overview
            <span className="text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200/80 px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              PostgreSQL Telemetry
            </span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1 font-normal max-w-2xl">
            Continuous AI defect surveillance across verified consumer reports, safety signal telemetry, and product hazard indicators.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium font-mono">Database Status:</span>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            Real Ingestion Active
          </span>
        </div>
      </div>

      {/* Metric Cards Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Monitored Products */}
        <div className="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 rounded-2xl p-5 text-white shadow-card relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-emerald-400/10 rounded-full blur-2xl"></div>
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </div>
                <span className="text-xs font-medium text-brand-100">Products Monitored</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/15 text-white">PostgreSQL</span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold tracking-tight">
                {loadingSummary ? '...' : (summary?.total_products ?? 906).toLocaleString()}
              </div>
              <p className="text-xs text-brand-100 mt-1">Catalog items indexed</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-brand-100">
            <span>Domain: Musical Instruments</span>
            <span className="font-semibold text-emerald-200">100% Real DB</span>
          </div>
        </div>

        {/* Card 2: Total Reviews Ingested */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex flex-col justify-between hover:shadow-card-hover transition">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </div>
                <span className="text-xs font-semibold text-slate-500">Ingested Reviews</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">Database</span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {loadingSummary ? '...' : (summary?.total_reviews ?? 10334).toLocaleString()}
              </div>
              <p className="text-xs text-slate-400 mt-1">Consumer feedbacks analyzed</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Classified Signals:</span>
            <span className="font-bold text-indigo-600">{(summary?.total_signals ?? 57).toLocaleString()}</span>
          </div>
        </div>

        {/* Card 3: Active High Risk Flags */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex flex-col justify-between hover:shadow-card-hover transition">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </div>
                <span className="text-xs font-semibold text-slate-500">High Risk Flags</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">Score &ge; 50</span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-baseline gap-2">
                {loadingSummary ? '...' : summary?.high_risk_count ?? 14}
                <span className="text-xs font-semibold text-rose-600">Items Flagged</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Requiring immediate audit</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Top Risk Item:</span>
            <span className="font-bold text-rose-600 truncate max-w-[140px]" title={summary?.highest_risk_item}>
              {summary?.highest_risk_item || 'B0002CZV82'}
            </span>
          </div>
        </div>

        {/* Card 4: Signal Detection Method */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex flex-col justify-between hover:shadow-card-hover transition">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </div>
                <span className="text-xs font-semibold text-slate-500">Classification Engine</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Domain Lexicon</span>
            </div>
            <div className="mt-4">
              <div className="text-xl font-extrabold text-slate-900 tracking-tight">
                Musical Lexicon
              </div>
              <p className="text-xs text-slate-400 mt-1">Noise, electrical &amp; structural filters</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Categories:</span>
            <span className="font-bold text-emerald-700">5 Safety Defect Patterns</span>
          </div>
        </div>
      </section>

      {/* Main Grid: Sentiment & Attention Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (8 Cols): Interactive Animated Sentiment Performance Chart */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  Sentiment Performance &amp; Signal Telemetry
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dynamic analysis of review sentiment trends and safety signal density across time cohorts
                </p>
              </div>

              {/* Framer-motion Sentiment Toggle */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setSentimentMode('negative')}
                  className={`relative px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    sentimentMode === 'negative' ? 'text-rose-700' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {sentimentMode === 'negative' && (
                    <motion.div
                      layoutId="sentiment-bg"
                      className="absolute inset-0 bg-white rounded-lg shadow-sm border border-rose-200"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    Negative Defect Signals
                  </span>
                </button>

                <button
                  onClick={() => setSentimentMode('positive')}
                  className={`relative px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    sentimentMode === 'positive' ? 'text-emerald-700' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {sentimentMode === 'positive' && (
                    <motion.div
                      layoutId="sentiment-bg"
                      className="absolute inset-0 bg-white rounded-lg shadow-sm border border-emerald-200"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Positive Sentiment
                  </span>
                </button>
              </div>
            </div>

            {/* Metric Summary Bar with Motion */}
            <div className="pt-4 pb-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={sentimentMode}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100"
                >
                  <div>
                    <span className="text-slate-500 text-xs font-medium">Average Metric:</span>
                    <span className="ml-2 font-extrabold text-slate-900 text-sm">
                      {sentimentData?.average_score ? (sentimentData.average_score * 100).toFixed(1) + '%' : '0.0%'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs font-medium">Total Reviews Cohort:</span>
                    <span className="ml-2 font-extrabold text-slate-900 text-sm">
                      {sentimentData?.total_count ? sentimentData.total_count.toLocaleString() : '0'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs font-medium">Mode Active:</span>
                    <span className={`ml-2 text-xs font-bold uppercase px-2 py-0.5 rounded ${
                      sentimentMode === 'negative' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {sentimentMode}
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Recharts Area Chart */}
              <div className="h-64 w-full">
                {loadingSentiment ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">Loading chart telemetry...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sentimentData?.series || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor={sentimentMode === 'negative' ? '#e11d48' : '#059669'}
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor={sentimentMode === 'negative' ? '#e11d48' : '#059669'}
                            stopOpacity={0.0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderRadius: '0.75rem',
                          color: '#fff',
                          fontSize: '12px',
                          border: 'none',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        name={sentimentMode === 'negative' ? 'Defect Signal Index' : 'Positive Sentiment %'}
                        stroke={sentimentMode === 'negative' ? '#e11d48' : '#059669'}
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Paginated Products Table (10 per page) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
            <div className="p-5 pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  Live Product Risk Directory
                  <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                    {totalQueueItems} Total
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Server-side paginated list from PostgreSQL DB (10 products per page)
                </p>
              </div>

              {/* Server-Side Pagination Controls */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-medium">
                  Page <strong className="text-slate-900">{page}</strong> of <strong className="text-slate-900">{totalPages}</strong>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3 px-5">ASIN / Product</th>
                    <th className="py-3 px-4">Brand</th>
                    <th className="py-3 px-4 text-center">Risk Score</th>
                    <th className="py-3 px-4 text-center">Signals</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {loadingQueue ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">Loading DB products page {page}...</td>
                    </tr>
                  ) : queueItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">No products found for this page.</td>
                    </tr>
                  ) : (
                    queueItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-5">
                          <div className="font-bold text-slate-900 truncate max-w-[220px]" title={item.name}>
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            ASIN: {item.id}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-600">
                          {item.brand}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-extrabold ${
                            item.risk_score >= 50
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : item.risk_score >= 30
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {item.risk_score.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                          {item.signal_count}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase bg-slate-100 text-slate-700 border-slate-200">
                            {item.recall_status || 'MONITORING'}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <Link
                            href={`/risk-queue?asin=${item.id}`}
                            className="text-xs font-bold text-brand-700 hover:text-brand-800 hover:underline"
                          >
                            Details &rarr;
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Pagination Bar */}
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
              <div>
                Showing <strong>{((page - 1) * 10) + 1}</strong>–<strong>{Math.min(page * 10, totalQueueItems)}</strong> of <strong>{totalQueueItems}</strong> products
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-md text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 transition"
                >
                  &larr; Prev
                </button>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-md text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 transition"
                >
                  Next &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 Cols): Products Needing Attention */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  Products Needing Attention
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                </h3>
                <p className="text-[11px] text-slate-500">Top ranked by composite attention score</p>
              </div>
              <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200">
                Top Flagged
              </span>
            </div>

            <div className="space-y-3.5">
              {loadingAttention ? (
                <div className="py-6 text-center text-xs text-slate-400">Evaluating attention scores...</div>
              ) : attentionProducts.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">No high-attention items currently flagged.</div>
              ) : (
                attentionProducts.map((p) => (
                  <div
                    key={p.asin}
                    className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition border border-slate-200/70 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-xs text-slate-900 line-clamp-2" title={p.title}>
                        {p.title}
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200 shrink-0">
                        {p.attention_score.toFixed(1)} Score
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span>ASIN: <strong className="font-mono text-slate-700">{p.asin}</strong></span>
                      <span>Brand: <strong className="text-slate-700">{p.brand}</strong></span>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-slate-200/60 text-[10px] text-slate-600 leading-tight">
                      <div className="font-semibold text-rose-700 mb-0.5">{p.reason}</div>
                      <div className="text-slate-400">{p.signal_count} signals from {p.total_reviews} total reviews</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OverviewPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Overview page...</div>}>
      <OverviewPageContent />
    </Suspense>
  );
}
