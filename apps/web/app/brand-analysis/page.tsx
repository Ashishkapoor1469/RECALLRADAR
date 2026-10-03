'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getApiUrl } from '../../lib/api';

interface EvidenceSample {
  id: string;
  date: string;
  rating: number;
  danger_phrase: string;
  signal_type: string;
  text: string;
}

interface ScoredProduct {
  asin: string;
  name: string;
  category: string;
  total_reviews: number;
  hazard_score: number;
  confidence_score: number;
  confidence_label: string;
  risk_level: string;
  flagged_count: number;
  top_cluster: string;
  analytical_summary: string;
  evidence_samples: EvidenceSample[];
  velocity_ratio: number;
}

interface SummaryStats {
  total_products: number;
  total_reviews: number;
  flagged_products: number;
  top_hazard_cluster: string;
  average_hazard_score: number;
  threshold_used: number;
}

interface AnalysisResult {
  report_id: string;
  brand_name: string;
  company_name: string;
  summary_stats: SummaryStats;
  scored_products: ScoredProduct[];
  pdf_filename: string;
  csv_filename: string;
  contact_email: string | null;
  verified_contact: any;
  execution_time_seconds: number;
  timestamp: string;
}

interface PresetBrand {
  brand_key: string;
  name: string;
  company: string;
  category: string;
  product_count: number;
  total_reviews: number;
  default_contact_email: string;
}

export default function BrandAnalysisPage() {
  const [query, setQuery] = useState('boAt');
  const [threshold, setThreshold] = useState(50.0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [supportedBrands, setSupportedBrands] = useState<PresetBrand[]>([]);
  const [selectedProductIndex, setSelectedProductIndex] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    fetchSupportedBrands();
    // Pre-load default analysis for boAt
    triggerAnalysis('boAt');
  }, []);

  useEffect(() => {
    let timer: any;
    if (loading) {
      setElapsedSeconds(0);
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [loading]);

  const fetchSupportedBrands = async () => {
    try {
      const res = await fetch(getApiUrl('/api/v1/brand-outreach/supported-brands'));
      if (res.ok) {
        const data = await res.json();
        setSupportedBrands(data);
      }
    } catch (e) {
      console.error('Failed to load supported brands', e);
    }
  };

  const triggerAnalysis = async (brandQuery: string) => {
    if (!brandQuery.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(getApiUrl('/api/v1/brand-outreach/analyze'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: brandQuery, threshold: Number(threshold) }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Analysis request failed');
      }

      const data: AnalysisResult = await res.json();
      setResult(data);
      setSelectedProductIndex(0);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during brand analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerAnalysis(query);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Executive Header Banner */}
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200">
                Phase 1–3 Complete
              </span>
              <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Cold-Start Hazard Engine
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Brand Outreach Intelligence
            </h1>
            <p className="text-slate-500 text-sm mt-1 max-w-3xl">
              Zero-history brand defect surveillance. Ingest public product listings and reviews, execute interpretable hazard scoring, and auto-generate executive outreach artifacts (PDF + CSV) for brand pitch collateral.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {result && (
              <>
                <a
                  href={getApiUrl(`/api/v1/brand-outreach/reports/${result.report_id}/download-pdf`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition transform active:scale-95"
                >
                  <svg className="w-4 h-4 text-rose-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  <span>Download PDF Report</span>
                </a>

                <a
                  href={getApiUrl(`/api/v1/brand-outreach/reports/${result.report_id}/download-csv`)}
                  download
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-sm transition"
                >
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download CSV</span>
                </a>
              </>
            )}
          </div>
        </div>

        {/* Brand Search & ASIN Input Bar */}
        <form onSubmit={handleSearchSubmit} className="mt-6 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter brand name (e.g. boAt, Boult, Noise, Prestige) or paste Amazon URL / ASIN..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Scanning Catalog ({elapsedSeconds}s)...</span>
              </>
            ) : (
              <>
                <span>Run Brand Radar</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Preset Quick Select Pills */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 mr-1">Target Brands:</span>
          {supportedBrands.map((b) => (
            <button
              key={b.brand_key}
              type="button"
              onClick={() => {
                setQuery(b.name);
                triggerAnalysis(b.name);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                result?.brand_name.toLowerCase() === b.name.toLowerCase()
                  ? 'bg-brand-50 border-brand-300 text-brand-700 shadow-sm'
                  : 'bg-slate-100/80 hover:bg-slate-200/80 border-slate-200 text-slate-600'
              }`}
            >
              <span>{b.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-white/80 rounded border border-slate-200/80 text-slate-500">
                {b.product_count} SKUs
              </span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center gap-3">
          <svg className="w-5 h-5 text-rose-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* KPI Metric Cards */}
      {result && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 sm:gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Products Scanned</span>
              <div className="text-2xl font-black text-slate-900">{result.summary_stats.total_products}</div>
              <span className="text-[11px] text-slate-500 font-medium">SKUs cataloged</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Reviews Analyzed</span>
              <div className="text-2xl font-black text-slate-900">{result.summary_stats.total_reviews}</div>
              <span className="text-[11px] text-slate-500 font-medium">Verified customer submissions</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm bg-gradient-to-b from-rose-50/30 to-transparent">
              <span className="text-xs font-semibold text-rose-700 block mb-1">Risk Threshold Exceeded</span>
              <div className="text-2xl font-black text-rose-600">{result.summary_stats.flagged_products}</div>
              <span className="text-[11px] text-rose-600 font-medium">Score &ge; {threshold} pts</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Primary Hazard Signal</span>
              <div className="text-sm font-bold text-slate-900 truncate mt-1">
                {result.summary_stats.top_hazard_cluster}
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Dominant cluster</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Pipeline Execution Time</span>
              <div className="text-2xl font-black text-indigo-600">{result.execution_time_seconds}s</div>
              <span className="text-[11px] text-emerald-600 font-medium">Real-time (target &lt; 180s)</span>
            </div>
          </div>

          {/* Main 2-Column Dashboard View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Ranked Catalog Table (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Ranked Product Defect Analysis</h2>
                  <p className="text-xs text-slate-500">Sorted by Interpretable Hazard Score (0–100)</p>
                </div>
                <span className="text-xs font-medium text-slate-400">
                  Target: <b>{result.brand_name}</b> ({result.company_name})
                </span>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200/80">
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Product / ASIN</th>
                      <th className="py-3 px-4 text-center">Hazard Score</th>
                      <th className="py-3 px-4">Primary Defect</th>
                      <th className="py-3 px-4 text-center">Flagged Revs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {result.scored_products.map((p, idx) => {
                      const isSelected = idx === selectedProductIndex;
                      const score = p.hazard_score;
                      const isHigh = score >= 70;
                      const isMed = score >= 50 && score < 70;

                      return (
                        <tr
                          key={p.asin}
                          onClick={() => setSelectedProductIndex(idx)}
                          className={`cursor-pointer transition ${
                            isSelected
                              ? 'bg-indigo-50/70 border-l-4 border-l-brand-600'
                              : 'hover:bg-slate-50/80'
                          }`}
                        >
                          <td className="py-3.5 px-4 font-bold text-slate-400">{idx + 1}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 leading-snug line-clamp-1">{p.name}</div>
                            <div className="text-[11px] font-mono text-slate-400 mt-0.5">{p.asin} &bull; {p.category}</div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-extrabold ${
                                isHigh
                                  ? 'bg-rose-100 text-rose-700'
                                  : isMed
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {score.toFixed(1)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-medium text-slate-700 block truncate max-w-[150px]">
                              {p.top_cluster}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                            {p.flagged_count} / {p.total_reviews}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Outreach Contact Confirmation Footer (Phase 4 Human-in-the-Loop) */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>
                    Verified Outreach Recipient: <b>{result.contact_email || 'No verified email on file'}</b>
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">
                  Phase 4 & 5 Human Dispatch Ready
                </span>
              </div>
            </div>

            {/* Right: Selected Product Deep-Dive & Real Evidence Excerpts (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {result.scored_products[selectedProductIndex] && (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Evidence Citation View
                      </span>
                      <span
                        className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                          result.scored_products[selectedProductIndex].hazard_score >= 70
                            ? 'bg-rose-100 text-rose-700'
                            : result.scored_products[selectedProductIndex].hazard_score >= 50
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        Risk Level: {result.scored_products[selectedProductIndex].risk_level}
                      </span>
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                      {result.scored_products[selectedProductIndex].name}
                    </h3>
                    <p className="text-xs font-mono text-slate-400">
                      ASIN: {result.scored_products[selectedProductIndex].asin} &bull; Velocity:{' '}
                      {result.scored_products[selectedProductIndex].velocity_ratio.toFixed(1)}x
                    </p>
                  </div>

                  {/* Plain-Language Written Summary (Reuse Risk Queue citation pattern) */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed space-y-2">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Automated Hazard Diagnosis</span>
                    </div>
                    <p>{result.scored_products[selectedProductIndex].analytical_summary}</p>
                  </div>

                  {/* Verbatim Review Evidence Quotes */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                      Verified Review Evidence Citations ({result.scored_products[selectedProductIndex].evidence_samples.length})
                    </h4>

                    {result.scored_products[selectedProductIndex].evidence_samples.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        No critical hazard mentions detected in review corpus for this SKU.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {result.scored_products[selectedProductIndex].evidence_samples.map((ev, i) => (
                          <div
                            key={i}
                            className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200/80 space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-mono font-bold text-slate-700">
                                {ev.id} &bull; {ev.date}
                              </span>
                              <span className="font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded text-[10px]">
                                Signal: {ev.danger_phrase}
                              </span>
                            </div>
                            <p className="text-xs text-slate-800 italic leading-snug">
                              &ldquo;{ev.text}&rdquo;
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
