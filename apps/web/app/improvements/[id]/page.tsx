'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getApiUrl } from '../../../lib/api';
import { useLiveData } from '../../../lib/useLiveData';
import AnimatedCounter from '../../../components/AnimatedCounter';
import FeatureFlagBoundary from '../../../components/FeatureFlagBoundary';

interface EvidenceItem {
  signal_id: string;
  review_id: string;
  suggestion_text: string;
  full_review: string;
  rating: number | null;
  review_date: string | null;
  confidence: number;
}

interface ClusterDetail {
  cluster_label: string;
  category: string;
  count: number;
  evidence: EvidenceItem[];
}

interface ProductDetailData {
  product: {
    id: string;
    asin: string;
    name: string;
    brand: string;
    category: string;
    description: string | null;
  };
  metric: {
    improvement_index: number;
    improvement_score: number;
    review_count: number;
    cluster_count: number;
    top_cluster: string;
  };
  clusters: ClusterDetail[];
}

function ProductImprovementDetailContent({ id }: { id: string }) {
  const [data, setData] = useState<ProductDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);

  const fetchDetails = async (isBackground: boolean = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await fetch(getApiUrl(`/api/v1/improvements/${id}`));
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (!selectedCluster && json.clusters && json.clusters.length > 0) {
          setSelectedCluster(json.clusters[0].cluster_label);
        }
      }
    } catch (err) {
      console.error('Error fetching improvement detail:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useLiveData(
    async (isBackground) => {
      fetchDetails(isBackground);
    },
    ['reviews', 'signals', 'products'],
    [id]
  );

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 font-medium text-xs">
        Loading product improvement clusters and review evidence...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-12 text-center text-slate-500 font-medium text-xs">
        Product not found or has no recorded improvement suggestions.
        <div className="mt-4">
          <Link href="/improvements" className="text-violet-600 font-bold hover:underline">
            &larr; Back to Improvement Insights
          </Link>
        </div>
      </div>
    );
  }

  const { product, metric, clusters } = data;
  const activeCluster = clusters.find((c) => c.cluster_label === selectedCluster) || clusters[0];

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/improvements"
        className="text-xs font-bold text-violet-700 hover:underline flex items-center gap-1"
      >
        <span>&larr;</span> Back to Improvement Insights
      </Link>

      {/* Product Banner Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
              VOICE OF CUSTOMER CLUSTER
            </span>
            <span className="text-[11px] text-slate-400 font-mono">ASIN: {product.asin}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight break-words">
            {product.name}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-semibold">
            Brand: <span className="text-slate-700 font-bold">{product.brand}</span> • Category: <span className="text-slate-700 font-bold">{product.category}</span>
          </p>
          {product.description && (
            <p className="text-xs text-slate-600 mt-2 max-w-xl leading-relaxed">{product.description}</p>
          )}

          <div className="mt-3.5 inline-flex items-center gap-2 bg-violet-50/80 border border-violet-200/80 px-3 py-1.5 rounded-xl text-xs font-bold text-violet-900">
            <span className="text-violet-600">💡 Primary Request:</span>
            <span className="font-extrabold text-violet-800">{metric.top_cluster}</span>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-6 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6">
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
              Improvement Index
            </span>
            <span className="text-2xl sm:text-3xl font-black text-violet-700">
              <AnimatedCounter value={metric.improvement_index} decimals={1} />
              <span className="text-xs font-normal text-slate-400"> / 100</span>
            </span>
          </div>
          <div className="border-l border-slate-100 pl-4 sm:pl-6">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
              Reviews Analyzed
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-800">
              <AnimatedCounter value={metric.review_count} />
            </span>
          </div>
        </div>
      </div>

      {/* Clusters Tab Selector */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-card">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Clustered Improvement Requests ({clusters.length})
        </h2>
        <div className="flex flex-wrap gap-2">
          {clusters.map((c) => {
            const isSelected = selectedCluster === c.cluster_label;
            return (
              <button
                key={c.cluster_label}
                onClick={() => setSelectedCluster(c.cluster_label)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  isSelected
                    ? 'bg-violet-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{c.cluster_label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-violet-800 text-white' : 'bg-slate-200 text-slate-700 font-bold'
                }`}>
                  {c.count} {c.count === 1 ? 'user' : 'users'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Evidence Citations for Active Cluster */}
      {activeCluster && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Customer Citations for &quot;{activeCluster.cluster_label}&quot;
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Category: <span className="font-semibold text-slate-700">{activeCluster.category}</span> • Consensus:{' '}
                <span className="font-bold text-violet-700">{activeCluster.count} customer reports</span>
              </p>
            </div>
            <span className="text-[11px] font-bold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-200">
              Verified Evidence
            </span>
          </div>

          <div className="space-y-3">
            {activeCluster.evidence.map((ev, i) => (
              <div
                key={ev.signal_id || i}
                className="p-4 rounded-xl border border-slate-200/70 bg-slate-50/50 hover:bg-slate-50 transition"
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-500">
                      {'★'.repeat(Math.round(ev.rating || 4))}
                      {'☆'.repeat(5 - Math.round(ev.rating || 4))}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {ev.review_date || 'Recent review'}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">
                    Confidence: {(ev.confidence * 100).toFixed(0)}%
                  </span>
                </div>

                {/* Highlighted actionable suggestion */}
                <div className="mb-2 p-2 rounded-lg bg-violet-50 border border-violet-100 text-xs font-semibold text-violet-900">
                  <span className="text-violet-600 font-bold mr-1">Suggested Change:</span>
                  &ldquo;{ev.suggestion_text}&rdquo;
                </div>

                {/* Full review citation text */}
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  &ldquo;{ev.full_review}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductImprovementDetailPage({ params }: { params: { id: string } }) {
  return (
    <FeatureFlagBoundary featureName="Improvement Product Detail">
      <ProductImprovementDetailContent id={params.id} />
    </FeatureFlagBoundary>
  );
}
