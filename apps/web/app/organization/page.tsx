'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getApiUrl } from '../../lib/api';
import { useLiveData } from '../../lib/useLiveData';
import AnimatedCounter from '../../components/AnimatedCounter';
import FeatureFlagBoundary from '../../components/FeatureFlagBoundary';
import { motion, AnimatePresence } from 'framer-motion';

interface HoldItem {
  id: string;
  product_id: string;
  product_name: string;
  asin: string;
  brand: string;
  category: string;
  status: 'ON_HOLD' | 'RESOLVED' | string;
  hazard_score: number;
  threshold: number;
  reason: string;
  evidence_citations: {
    review_id?: string;
    rating?: number;
    title?: string;
    body: string;
    date?: string;
    danger_phrase?: string;
  }[];
  hold_started_at: string;
  resolved_at?: string | null;
  resolved_by?: string | null;
  resolve_reason?: string | null;
  recheck_score?: number | null;
  duration_hours: number;
  org_notified: boolean;
  org_hold_response?: any;
  org_resume_response?: any;
}

interface RecheckResult {
  product_id: string;
  product_name: string;
  recalculated_score: number;
  threshold: number;
  is_above_threshold: boolean;
  signal_count: number;
  negative_reviews: number;
  total_reviews: number;
  warning?: string | null;
}

function OrganizationContent() {
  const [holds, setHolds] = useState<HoldItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'ON_HOLD' | 'RESOLVED' | 'ALL'>('ON_HOLD');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Recheck & Resume state
  const [inspectingItem, setInspectingItem] = useState<HoldItem | null>(null);
  const [recheckData, setRecheckData] = useState<RecheckResult | null>(null);
  const [rechecking, setRechecking] = useState<boolean>(false);
  const [resuming, setResuming] = useState<boolean>(false);
  const [overrideNotes, setOverrideNotes] = useState<string>('');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string; details?: any } | null>(null);

  // Sync / Auto-refresh
  useLiveData(
    async () => {
      fetchHolds();
    },
    ['products', 'signals', 'reviews']
  );

  useEffect(() => {
    fetchHolds();
  }, [activeTab]);

  const fetchHolds = async () => {
    try {
      setLoading(true);
      const url = activeTab === 'ALL' 
        ? getApiUrl('/api/v1/organization/holds')
        : getApiUrl(`/api/v1/organization/holds?status=${activeTab}`);
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setHolds(data.items || []);
      }
    } catch (e) {
      console.error('Failed to load organization holds', e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartResumeFlow = async (item: HoldItem) => {
    setInspectingItem(item);
    setRechecking(true);
    setRecheckData(null);
    setActionMessage(null);
    setOverrideNotes('');

    try {
      const res = await fetch(getApiUrl(`/api/v1/organization/holds/${item.product_id}/recheck`), {
        method: 'POST'
      });
      if (res.ok) {
        const data: RecheckResult = await res.json();
        setRecheckData(data);
      } else {
        throw new Error('Failed to recalculate hazard telemetry');
      }
    } catch (e: any) {
      setActionMessage({ type: 'error', text: e.message || 'Error executing recheck' });
    } finally {
      setRechecking(false);
    }
  };

  const handleConfirmResume = async (force: boolean) => {
    if (!inspectingItem) return;
    setResuming(true);
    setActionMessage(null);

    try {
      const res = await fetch(getApiUrl(`/api/v1/organization/holds/${inspectingItem.product_id}/resume`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          force_resume: force,
          resolved_by: 'Organization Safety Officer',
          notes: overrideNotes || (force ? 'Manual supervisor override confirmed with elevated score' : 'Hazard verified resolved')
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage({
          type: 'success',
          text: `Sales channel successfully restored for ${inspectingItem.product_name}.`,
          details: data.org_response
        });
        fetchHolds();
        setTimeout(() => {
          setInspectingItem(null);
        }, 1800);
      } else if (data.requires_confirmation) {
        setActionMessage({
          type: 'error',
          text: data.message
        });
      } else {
        throw new Error(data.detail || data.message || 'Resume operation failed');
      }
    } catch (e: any) {
      setActionMessage({ type: 'error', text: e.message || 'Failed to resume product' });
    } finally {
      setResuming(false);
    }
  };

  const activeHoldCount = holds.filter((h) => h.status === 'ON_HOLD').length;
  const resolvedCount = holds.filter((h) => h.status === 'RESOLVED').length;

  const filteredHolds = holds.filter((h) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      h.product_name.toLowerCase().includes(q) ||
      h.asin.toLowerCase().includes(q) ||
      h.brand.toLowerCase().includes(q) ||
      (h.reason && h.reason.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Slide Deep-Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
              Organization Safety Control
            </span>
            <span className="text-xs font-semibold text-slate-500">• Retail Distribution & Catalog Halts</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Product Hold & Re-Entry Registry
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Automated quarantine trigger based on critical hazard scores (&ge; 70.0). Manual resume flow strictly enforces live data re-verification before restoring sales distribution.
          </p>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Products Currently On Hold</span>
            <div className="text-2xl font-black text-rose-600 mt-1">
              <AnimatedCounter value={activeHoldCount} />
            </div>
            <span className="text-[10px] font-bold text-rose-500">Pulled from Retail Sales</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 font-black">
            ⛔
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Resolved Authorizations</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              <AnimatedCounter value={resolvedCount} />
            </div>
            <span className="text-[10px] font-bold text-emerald-600">Re-verified Active Catalog</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-black">
            ✓
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Critical Trigger Threshold</span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              70.0 <span className="text-xs font-normal text-slate-400">/ 100</span>
            </div>
            <span className="text-[10px] font-bold text-indigo-600">Single Shared Standard</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold">
            ⚡
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Sales Ops Gateway</span>
            <div className="text-base font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Real HTTP Dispatch
            </div>
            <span className="text-[10px] font-semibold text-slate-400">Retry + Local Failover Queue</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold">
            📡
          </div>
        </div>
      </div>

      {/* Control Tabs & Search Bar */}
      <div className="bg-white border border-slate-200/80 p-3 sm:p-4 rounded-2xl shadow-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('ON_HOLD')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'ON_HOLD' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Active Holds ({activeHoldCount})
          </button>
          <button
            onClick={() => setActiveTab('RESOLVED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'RESOLVED' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Resolved ({resolvedCount})
          </button>
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Logs
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <input
            type="text"
            placeholder="Search by product, ASIN, reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      {/* Main List of Held Products */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card animate-pulse space-y-3">
              <div className="h-5 bg-slate-200 rounded w-1/3"></div>
              <div className="h-4 bg-slate-100 rounded w-2/3"></div>
              <div className="h-12 bg-slate-100 rounded"></div>
            </div>
          ))}
        </div>
      ) : filteredHolds.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200/80 text-center">
          <div className="text-3xl mb-2">🎉</div>
          <h3 className="text-base font-bold text-slate-900">No products matching this filter</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {activeTab === 'ON_HOLD' ? 'All catalog items are currently clear of critical threshold holds.' : 'No hold logs found.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHolds.map((h) => (
            <div
              key={h.id}
              className={`bg-white rounded-2xl p-5 border transition shadow-card flex flex-col justify-between ${
                h.status === 'ON_HOLD'
                  ? 'border-rose-200/80 hover:border-rose-300'
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Status & ASIN Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {h.status === 'ON_HOLD' ? (
                      <span className="inline-flex items-center gap-1.5 bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                        ON HOLD — SALES HALTED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm">
                        ✓ RESOLVED — SALES RESTORED
                      </span>
                    )}

                    <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      ASIN: {h.asin}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Brand: {h.brand}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    {h.product_name}
                  </h3>

                  {/* Hold Reason Banner */}
                  <div className="mt-2.5 bg-rose-50/80 border border-rose-200/70 p-3 rounded-xl text-xs text-rose-900 leading-relaxed">
                    <span className="font-bold text-rose-700">Trigger Reason:</span> {h.reason}
                  </div>

                  {/* Timestamps & Audit Trail Info */}
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <div>
                      <span>Hold Started:</span>{' '}
                      <strong className="text-slate-700">{h.hold_started_at}</strong>
                    </div>
                    {h.resolved_at && (
                      <div>
                        <span>Resolved:</span>{' '}
                        <strong className="text-emerald-700">{h.resolved_at}</strong>
                      </div>
                    )}
                    {h.resolved_by && (
                      <div>
                        <span>Officer:</span>{' '}
                        <strong className="text-slate-700">{h.resolved_by}</strong>
                      </div>
                    )}
                    <div>
                      <span>Duration:</span>{' '}
                      <strong className="text-slate-700">{h.duration_hours} hrs</strong>
                    </div>
                  </div>

                  {/* Evidence Citations (Risk Queue pattern) */}
                  {h.evidence_citations && h.evidence_citations.length > 0 && (
                    <div className="mt-3.5 pt-3 border-t border-slate-100">
                      <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Flagged Review Evidence ({h.evidence_citations.length})
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {h.evidence_citations.slice(0, 2).map((ev, idx) => (
                          <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px] text-slate-700">
                            <div className="flex items-center justify-between text-amber-600 font-bold mb-1">
                              <span>{ev.rating ? `${ev.rating} ★` : 'Customer Feedback'}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{ev.date || 'Verified'}</span>
                            </div>
                            <p className="line-clamp-2 italic">"{ev.body}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Score & Actions Panel */}
                <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-4 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Hazard Score
                    </span>
                    <div className="text-3xl font-black text-rose-600 leading-none mt-0.5">
                      {h.hazard_score.toFixed(1)}
                    </div>
                    {h.recheck_score != null && (
                      <span className="text-[10px] text-slate-500 font-semibold block mt-1">
                        Rechecked: {h.recheck_score.toFixed(1)}
                      </span>
                    )}
                  </div>

                  {h.status === 'ON_HOLD' ? (
                    <button
                      onClick={() => handleStartResumeFlow(h)}
                      className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white text-xs font-extrabold rounded-xl shadow-sm hover:shadow transition flex items-center gap-1.5"
                    >
                      <span>🔄</span>
                      <span>Resume Selling</span>
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <span>✓ Active in Catalog</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Re-check & Resume Confirmation Modal */}
      <AnimatePresence>
        {inspectingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
                    Safety Committee Re-Verification
                  </span>
                  <button
                    onClick={() => setInspectingItem(null)}
                    className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                  >
                    ✕
                  </button>
                </div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Resume Selling: {inspectingItem.product_name}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  ASIN: {inspectingItem.asin} • Threshold: {inspectingItem.threshold}
                </p>
              </div>

              {/* Live Hazard Re-check Output */}
              {rechecking ? (
                <div className="p-6 text-center space-y-2 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <div className="text-xs font-bold text-slate-700">Recomputing live hazard score from current reviews...</div>
                  <div className="text-[11px] text-slate-400">Strictly verifying data before permitting catalog restore.</div>
                </div>
              ) : recheckData ? (
                <div className="space-y-4">
                  {recheckData.is_above_threshold ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 space-y-2">
                      <div className="flex items-center gap-2 font-black text-xs text-amber-800">
                        <span className="text-base">⚠️</span>
                        <span>SCORE STILL ELEVATED ABOVE THRESHOLD</span>
                      </div>
                      <p className="text-xs text-amber-700 leading-relaxed font-medium">
                        Live recalculation shows hazard score is <strong>{recheckData.recalculated_score}</strong> (threshold is {recheckData.threshold}). Signal volume ({recheckData.signal_count} defects, {recheckData.negative_reviews} low ratings) has not dropped.
                      </p>
                      <p className="text-xs font-bold text-amber-800">
                        Resume anyway with supervisor safety override?
                      </p>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-900 space-y-1">
                      <div className="flex items-center gap-2 font-black text-xs text-emerald-800">
                        <span>✓</span>
                        <span>HAZARD SIGNAL SUBSIDED (SCORE: {recheckData.recalculated_score})</span>
                      </div>
                      <p className="text-xs text-emerald-700">
                        Live calculation confirms defect signals have dropped safely below the 70.0 threshold. Safe to resume active sales.
                      </p>
                    </div>
                  )}

                  {/* Override Justification Input */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      {recheckData.is_above_threshold ? 'Required Override Justification' : 'Resolution Notes (Optional)'}
                    </label>
                    <textarea
                      rows={2}
                      value={overrideNotes}
                      onChange={(e) => setOverrideNotes(e.target.value)}
                      placeholder={recheckData.is_above_threshold ? 'Explain engineering fix, hardware revision, or safety clearance...' : 'Cleared for active distribution...'}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>

                  {actionMessage && (
                    <div className={`p-3 rounded-xl text-xs font-medium ${
                      actionMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      {actionMessage.text}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => setInspectingItem(null)}
                      disabled={resuming}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={() => handleConfirmResume(recheckData.is_above_threshold)}
                      disabled={resuming}
                      className={`px-4 py-2 text-white text-xs font-extrabold rounded-xl shadow transition flex items-center gap-1.5 ${
                        recheckData.is_above_threshold
                          ? 'bg-amber-600 hover:bg-amber-700'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      {resuming ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Dispatching Org API...</span>
                        </>
                      ) : (
                        <>
                          <span>{recheckData.is_above_threshold ? 'Confirm Override & Resume' : 'Confirm & Restore Sales'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function OrganizationPage() {
  return (
    <FeatureFlagBoundary featureName="Organization Safety & Hold Registry">
      <OrganizationContent />
    </FeatureFlagBoundary>
  );
}
