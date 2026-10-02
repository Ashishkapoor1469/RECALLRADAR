'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { getApiUrl } from '../../lib/api';
import { useLiveData } from '../../lib/useLiveData';
import AnimatedCounter from '../../components/AnimatedCounter';
import FeatureFlagBoundary from '../../components/FeatureFlagBoundary';

interface ImprovementProduct {
  id: string;
  asin: string;
  name: string;
  brand: string;
  category: string;
  improvement_index: number;
  review_count: number;
  cluster_count: number;
  top_cluster: string;
  top_clusters: Array<{ cluster_label: string; count: number; category: string }>;
  updated_at: string;
}

interface StatsData {
  total_products_with_suggestions: number;
  total_improvement_reviews: number;
  average_improvement_index: number;
  top_requested_cluster: string;
  cluster_breakdown: Array<{ cluster: string; count: number }>;
}

function ImprovementInsightsContent() {
  const [items, setItems] = useState<ImprovementProduct[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'index' | 'count'>('index');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async (isBackground: boolean = false) => {
    if (!isBackground) setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        fetch(getApiUrl(`/api/v1/improvements/?sort_by=${sortBy}&page=1&page_size=100`)),
        fetch(getApiUrl('/api/v1/improvements/stats'))
      ]);

      if (listRes.ok) {
        const listData = await listRes.json();
        setItems(listData.items || []);
      }
      if (statsRes.ok) {
        const statsJson = await statsRes.json();
        setStats(statsJson);
      }
    } catch (err) {
      console.error('Error loading Improvement Insights:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useLiveData(
    async (isBackground) => {
      fetchData(isBackground);
    },
    ['reviews', 'signals', 'products'],
    [sortBy]
  );

  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.asin.toLowerCase().includes(q) ||
      (item.top_cluster && item.top_cluster.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Improvement Insights
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 whitespace-nowrap">
              Constructive Voice of Customer
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1 font-medium leading-relaxed">
            Identifies actionable product enhancements from positive/neutral reviews — separate from safety hazard alerts.
          </p>
        </div>

        {/* PPT Link */}
        <a
          href="https://recallradar-ppt.vercel.app/?slide=11&from=/improvements"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-50 border border-violet-200 text-violet-700 hover:bg-violet-100 hover:border-violet-300 transition shrink-0"
        >
          <span>📊 Slide 11: Improvement Insights &amp; Synthesis</span>
          <span className="text-[10px] text-violet-400">&rarr;</span>
        </a>
      </div>

      {/* KPI Stats Cards with Animated Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-card">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Products with Ideas
          </span>
          <div className="text-2xl sm:text-3xl font-black text-violet-700">
            <AnimatedCounter value={stats?.total_products_with_suggestions || items.length} />
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Active feedback queues</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-card">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Improvement Reviews
          </span>
          <div className="text-2xl sm:text-3xl font-black text-indigo-700">
            <AnimatedCounter value={stats?.total_improvement_reviews || 0} />
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Constructive suggestions</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-card">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Avg Improvement Index
          </span>
          <div className="text-2xl sm:text-3xl font-black text-purple-700">
            <AnimatedCounter value={stats?.average_improvement_index || 0} decimals={1} suffix=" / 100" />
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Consensus strength</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-card">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Top Clustered Request
          </span>
          <div className="text-sm font-bold text-slate-800 line-clamp-2 mt-1">
            {stats?.top_requested_cluster || 'Loading clusters...'}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Highest consensus</span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sort By:</span>
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/60">
            <button
              onClick={() => setSortBy('index')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                sortBy === 'index'
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Highest Improvement Index
            </button>
            <button
              onClick={() => setSortBy('count')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                sortBy === 'count'
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Highest Review Count
            </button>
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search product or ASIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64 pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-slate-50"
          />
          <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
        </div>
      </div>

      {/* Product List */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">
            Loading products with customer improvement proposals...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">
            No products match the selected criteria.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredItems.map((prod) => {
              const idxColor =
                prod.improvement_index >= 70
                  ? 'bg-violet-100 text-violet-800 border-violet-200'
                  : prod.improvement_index >= 40
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200';

              return (
                <Link
                  key={prod.id}
                  href={`/improvements/${prod.id}`}
                  className="block p-4 sm:p-5 hover:bg-slate-50/80 transition group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="font-mono text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded">
                          {prod.asin}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {prod.category}
                        </span>
                        <span className="text-[11px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded border border-violet-100">
                          {prod.cluster_count} {prod.cluster_count === 1 ? 'Cluster' : 'Clusters'}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-violet-700 transition">
                        {prod.name}
                      </h3>
                      {prod.top_cluster && (
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          <span className="font-medium text-slate-400">Top Consensus Request:</span>
                          <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            💡 {prod.top_cluster}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6 shrink-0 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                          Improvement Reviews
                        </span>
                        <span className="text-base font-black text-slate-800">
                          <AnimatedCounter value={prod.review_count} />
                        </span>
                      </div>

                      <div className="text-right pl-4 border-l border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                          Improvement Index
                        </span>
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className={`text-base font-black px-2.5 py-0.5 rounded-lg border ${idxColor}`}>
                            <AnimatedCounter value={prod.improvement_index} decimals={1} />
                          </span>
                          <span className="text-xs text-slate-400">/ 100</span>
                        </div>
                      </div>

                      <span className="text-slate-300 group-hover:text-violet-600 transition pl-2">
                        &rarr;
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ImprovementInsightsPage() {
  return (
    <FeatureFlagBoundary featureName="Improvement Insights">
      <ImprovementInsightsContent />
    </FeatureFlagBoundary>
  );
}
