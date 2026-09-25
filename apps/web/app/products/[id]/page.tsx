'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getApiUrl } from '../../../lib/api';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductDetails();
  }, [params.id]);

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl(`/api/v1/products/${params.id}`));
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching product detail:', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400 font-medium">Loading product safety investigation details...</div>;
  }

  const prod = data?.product || {};
  const riskScore = data?.current_risk ?? 0.0;
  const leadTime = data?.lead_time_weeks;
  const recallInfo = data?.recall;
  const reviews = data?.reviews || [];

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link href="/risk-queue" className="text-xs font-bold text-brand-700 hover:underline flex items-center gap-1">
        <span>&larr;</span> Back to Risk Queue
      </Link>

      {/* Product Banner Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
              riskScore >= 70 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}>
              {riskScore >= 70 ? 'CRITICAL HAZARD CLASSIFICATION' : 'MONITORED PRODUCT'}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">ID: {prod.id || params.id}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight break-words">{prod.name || 'Product Details'}</h1>
          <p className="text-xs text-slate-500 mt-1 font-semibold">
            Brand: <span className="text-slate-700 font-bold">{prod.brand || 'N/A'}</span> • Category: <span className="text-slate-700 font-bold">{prod.category || 'N/A'}</span>
          </p>
          {prod.description && (
            <p className="text-xs text-slate-600 mt-2 max-w-xl leading-relaxed">{prod.description}</p>
          )}

          {/* Signal Cluster Callout Tag */}
          <div className="mt-3.5 inline-flex items-center gap-2 bg-rose-50/80 border border-rose-200/80 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-900">
            <span className="text-rose-600">⚠ Signal Cluster:</span>
            <span className="font-extrabold text-rose-700">{data?.signal_cluster || 'No active defect signals'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-6 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6">
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Hazard Score</span>
            <span className={`text-2xl sm:text-3xl font-black ${riskScore >= 70 ? 'text-rose-600' : 'text-slate-700'}`}>
              {riskScore} <span className="text-xs font-normal text-slate-400">/ 100</span>
            </span>
          </div>
          <div className="border-l border-slate-100 pl-4 sm:pl-6">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Early Lead Window</span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-700">{leadTime || 'N/A'} <span className="text-xs font-normal text-slate-500">wks</span></span>
          </div>
        </div>
      </div>

      {/* Recall Warning Banner if Recalled */}
      {recallInfo && recallInfo.is_recalled && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 shadow-sm flex items-start gap-3">
          <span className="text-lg">⚠️</span>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800">CPSC Recall Action In Effect</h3>
            <p className="text-xs mt-1 leading-relaxed font-medium">{recallInfo.hazard || 'Formal product recall issued.'}</p>
            <p className="text-[11px] text-amber-700 mt-1">Official Date: {recallInfo.recall_date}</p>
          </div>
        </div>
      )}

      {/* Review Evidence Citations Grid */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">Verified Customer Evidence Citations ({reviews.length})</h2>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Matched Signal Evidence
          </span>
        </div>

        {reviews.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">No customer review citations found for this product.</div>
        ) : (
          <div className="space-y-3">
            {reviews.map((c: any, i: number) => (
              <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200/60 font-mono">
                      {c.id}
                    </span>
                    <span className="text-amber-500 font-bold">{c.rating} ★</span>
                    {c.matched_signal && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200 uppercase">
                        Matched Signal: "{c.matched_signal}"
                      </span>
                    )}
                  </div>
                  <span className="text-slate-400 font-medium">{c.date}</span>
                </div>
                <p className="text-xs text-slate-700 italic font-medium leading-relaxed">"{c.text}"</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
