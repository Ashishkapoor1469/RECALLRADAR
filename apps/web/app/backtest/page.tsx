'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';

interface BacktestMetrics {
  precision: number;
  recall: number;
  f1_score: number;
  median_lead_time_weeks: number;
  mean_lead_time_weeks: number;
  p25_lead_time_weeks: number;
  p75_lead_time_weeks: number;
  false_alarms_per_1000: number;
}

interface BacktestSummaryData {
  total_backtested_recalls: number;
  metrics: BacktestMetrics;
  recalls: Array<{
    id: string;
    product_name: string;
    asin: string;
    recall_date: string;
    early_flag_date: string;
    lead_time_weeks: number;
    hazard: string;
  }>;
  status_message?: string;
}

export default function BacktestLabPage() {
  const [alertBudget, setAlertBudget] = useState<number>(50);
  const [leadTimeHorizon, setLeadTimeHorizon] = useState<number>(8);
  const [summaryData, setSummaryData] = useState<BacktestSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    fetchBacktestSummary();
  }, []);

  const fetchBacktestSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/backtests/summary');
      if (res.ok) {
        const data = await res.json();
        setSummaryData(data);
      }
    } catch (e) {
      console.error('Error fetching backtest summary:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/backtests/simulate?alert_budget=${alertBudget}&horizon_weeks=${leadTimeHorizon}`);
      if (res.ok) {
        const data = await res.json();
        setSummaryData(data);
      }
    } catch (e) {
      console.error('Error running backtest simulation:', e);
    } finally {
      setSimulating(false);
    }
  };

  const metrics = summaryData?.metrics;
  const hasData = (summaryData?.total_backtested_recalls || 0) > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Historical Backtest Lab &amp; Alert Budget Calibration
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Database Validation
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Simulate early recall detection lead times without temporal leakage over historical database records.
          </p>
        </div>
      </div>

      {/* Interactive Controls & Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Sliders Controls */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Simulation Parameters</h2>
            {simulating && <span className="text-[11px] text-brand-700 font-bold animate-pulse">Running Simulation...</span>}
          </div>

          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-2">
              <span className="text-slate-700">Monthly Alert Budget Limit</span>
              <span className="text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200 font-mono">
                {alertBudget} Alerts / Mo
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={alertBudget}
              onChange={(e) => setAlertBudget(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Controls false alarm tolerance. Lower budget increases precision; higher budget maximizes recall.
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-2">
              <span className="text-slate-700">Early Warning Target Horizon</span>
              <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-mono">
                {leadTimeHorizon} Weeks Early
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="16"
              value={leadTimeHorizon}
              onChange={(e) => setLeadTimeHorizon(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
          </div>

          <button
            onClick={handleSimulate}
            disabled={simulating}
            className="w-full py-2.5 bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-700/20 hover:bg-brand-800 transition disabled:opacity-50"
          >
            Run Simulation Simulation Engine
          </button>

          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Historical Recall Rate:</span>
              <span className="font-extrabold text-brand-700 text-sm font-mono">
                {hasData && metrics ? `${(metrics.recall * 100).toFixed(1)}%` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">False Alarms / 1,000 Reviews:</span>
              <span className="font-extrabold text-slate-800 text-sm font-mono">
                {hasData && metrics ? metrics.false_alarms_per_1000.toFixed(1) : '0.0'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Median Early Lead Time:</span>
              <span className="font-extrabold text-emerald-700 text-sm font-mono">
                {hasData && metrics ? `${metrics.median_lead_time_weeks.toFixed(1)} wks` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Historical Validation Cases */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Real Database Backtest Cases</h2>
            <span className="text-xs font-semibold text-slate-500">
              {summaryData?.total_backtested_recalls ?? 0} Recalls Analyzed
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading backtest telemetry...</div>
          ) : !hasData ? (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto text-xl font-bold">
                !
              </div>
              <h3 className="text-base font-bold text-slate-900">Not enough data yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                {summaryData?.status_message ||
                  'No official labeled recall notices currently match the Musical Instruments dataset cohort in PostgreSQL.'}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                Zero fake or synthetic backtest entries generated.
              </p>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              {summaryData?.recalls.map((r) => (
                <div key={r.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      +{r.lead_time_weeks.toFixed(1)} wks lead time
                    </span>
                    <h3 className="font-bold text-slate-900 mt-1">{r.product_name}</h3>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      ASIN: {r.asin} • Hazard: {r.hazard}
                    </p>
                  </div>
                  <span className="font-extrabold text-emerald-700 text-sm font-mono">
                    +{r.lead_time_weeks.toFixed(1)} wks
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
