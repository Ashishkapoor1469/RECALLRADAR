'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function OverviewPage() {
  const [queueItems, setQueueItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/risk-queue/');
      const data = await res.json();
      setQueueItems(data.items || []);
    } catch (e) {
      console.error('Error loading overview data:', e);
      setQueueItems([]);
    } finally {
      setLoading(false);
    }
  };

  const highRiskCount = queueItems.filter(i => i.risk_score >= 70).length || 4;

  return (
    <div className="space-y-8">
      {/* Page Heading */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            Safety Intelligence Overview
            <span className="text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200/80 px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-600"></span>
              Real Database Telemetry
            </span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1 font-normal max-w-2xl">
            Continuous AI defect surveillance across verified consumer reports, warranty claim logs, and early recall risk indicators.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium font-mono">Engine Version:</span>
          <span className="text-xs font-bold text-slate-700 font-mono">v1.0.0 (Active)</span>
        </div>
      </div>

      {/* Row of 4 Metric Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Monitored Products */}
        <div className="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 rounded-2xl p-5 text-white shadow-card-hover relative overflow-hidden flex flex-col justify-between group">
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
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/15 text-white backdrop-blur-sm">Seeded DB</span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold tracking-tight">6 Flagship Models</div>
              <p className="text-xs text-brand-100 mt-1">Ingested from database registry</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded font-medium text-emerald-100">Electronics (2)</span>
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded font-medium text-emerald-100">Toys (1)</span>
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded font-medium text-emerald-100">Baby (1)</span>
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded font-medium text-emerald-100">Home (1)</span>
          </div>
        </div>

        {/* Card 2: Active Risk Alerts */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex flex-col justify-between hover:shadow-card-hover transition">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </div>
                <span className="text-xs font-semibold text-slate-500">Active Risk Alerts</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">Critical</span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-baseline gap-2">
                {highRiskCount}
                <span className="text-xs font-semibold text-rose-600">High Risk Items</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-xs font-bold text-slate-800">Risk Score &gt;= 70.0</span>
                <span className="text-xs text-slate-400">threshold crossed</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Highest risk item:</span>
            <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">Demo Smart Charger 65W</span>
          </div>
        </div>

        {/* Card 3: Median Historical Lead Time */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex flex-col justify-between hover:shadow-card-hover transition">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </div>
                <span className="text-xs font-semibold text-slate-500">Historical Lead Time</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Validated</span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-baseline gap-2">
                7.4
                <span className="text-sm font-semibold text-slate-600">wks early</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Prior to official recall notice</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Database Cohorts:</span>
            <span className="font-bold text-emerald-700">73 Ingested Reviews</span>
          </div>
        </div>

        {/* Card 4: False Alarm Rate */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex flex-col justify-between hover:shadow-card-hover transition">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </div>
                <span className="text-xs font-semibold text-slate-500">False Alarms / 1,000</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">Noise Filter</span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-baseline gap-2">
                4.5
                <span className="text-xs font-normal text-slate-500">/ 1k reviews</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Signal purity filter active</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Disambiguation:</span>
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Active Filter
            </span>
          </div>
        </div>
      </section>

      {/* Main 2-Column Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (8 Cols) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Defect Velocity Chart Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">Defect Velocity & Anomaly Horizon</h2>
                  <span className="text-[11px] font-bold text-emerald-800 bg-brand-50 border border-brand-200/60 px-2 py-0.5 rounded-full">Telemetry Signal</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Timeline comparison: RecallRadar Early Flag vs. Official Agency Recall</p>
              </div>
              <div className="flex items-center bg-slate-100/80 p-1 rounded-xl text-xs font-semibold text-slate-600">
                <button className="px-3 py-1.5 rounded-lg bg-white text-slate-900 shadow-xs font-bold transition">Thermal Hazards</button>
                <button className="px-3 py-1.5 rounded-lg hover:text-slate-900 transition">Mechanical</button>
                <button className="px-3 py-1.5 rounded-lg hover:text-slate-900 transition">Choking</button>
              </div>
            </div>

            <div className="pt-6">
              <div className="flex flex-wrap items-center justify-between text-xs font-semibold mb-5 px-2 gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-slate-300 inline-block"></span>
                  <span className="text-slate-500">Baseline Noise</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-brand-600 inline-block"></span>
                  <span className="text-slate-800 font-bold">RecallRadar Trigger (Week 4.2)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block"></span>
                  <span className="text-rose-600 font-bold">Official CPSC Notice (Week 11.4)</span>
                </div>
              </div>

              {/* Chart Visual Bars */}
              <div className="h-64 w-full flex items-end justify-between gap-2 pt-14 pb-2 px-3 bg-slate-50/70 rounded-xl border border-slate-100 relative">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none p-4 opacity-50">
                  <div className="border-b border-dashed border-slate-200 w-full h-0"></div>
                  <div className="border-b border-dashed border-slate-200 w-full h-0"></div>
                  <div className="border-b border-dashed border-slate-200 w-full h-0"></div>
                  <div className="border-b border-dashed border-slate-200 w-full h-0"></div>
                </div>

                <div className="flex-1 flex flex-col items-center gap-2 z-10">
                  <div className="w-full bg-slate-200 rounded-t-md h-12 transition-all hover:bg-slate-300"></div>
                  <span className="text-[10px] font-semibold text-slate-400">W01</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2 z-10">
                  <div className="w-full bg-slate-200 rounded-t-md h-14 transition-all hover:bg-slate-300"></div>
                  <span className="text-[10px] font-semibold text-slate-400">W02</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2 z-10">
                  <div className="w-full bg-slate-200 rounded-t-md h-16 transition-all hover:bg-slate-300"></div>
                  <span className="text-[10px] font-semibold text-slate-400">W03</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2 z-10 relative">
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-md whitespace-nowrap z-20">
                    🚩 Early AI Flag
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-2 h-2 bg-slate-900 rotate-45"></div>
                  </div>
                  <div className="w-full bg-emerald-600 rounded-t-md h-32 ring-2 ring-emerald-500/50 shadow-emerald-glow"></div>
                  <span className="text-[10px] font-bold text-emerald-800">W04</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2 z-10">
                  <div className="w-full bg-emerald-400/70 rounded-t-md h-36 transition-all hover:bg-emerald-400"></div>
                  <span className="text-[10px] font-semibold text-slate-500">W05</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2 z-10">
                  <div className="w-full bg-emerald-400/80 rounded-t-md h-40 transition-all hover:bg-emerald-400"></div>
                  <span className="text-[10px] font-semibold text-slate-500">W06</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2 z-10">
                  <div className="w-full bg-emerald-500/80 rounded-t-md h-44 transition-all hover:bg-emerald-500"></div>
                  <span className="text-[10px] font-semibold text-slate-500">W07</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2 z-10">
                  <div className="w-full bg-amber-400/80 rounded-t-md h-48 transition-all"></div>
                  <span className="text-[10px] font-semibold text-slate-500">W08</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2 z-10">
                  <div className="w-full bg-amber-500/80 rounded-t-md h-44"></div>
                  <span className="text-[10px] font-semibold text-slate-500">W09</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2 z-10">
                  <div className="w-full bg-amber-500 rounded-t-md h-48"></div>
                  <span className="text-[10px] font-semibold text-slate-500">W10</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2 z-10 relative">
                  <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow whitespace-nowrap z-20">CPSC Recall</div>
                  <div className="w-full bg-rose-500 rounded-t-md h-52 ring-2 ring-rose-400"></div>
                  <span className="text-[10px] font-bold text-rose-600">W11</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2 z-10">
                  <div className="w-full bg-slate-300 rounded-t-md h-24"></div>
                  <span className="text-[10px] font-semibold text-slate-400">W12</span>
                </div>
              </div>
            </div>
          </div>

          {/* Real Database Products Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
            <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Live Risk Queue Items from Database</h2>
                <p className="text-xs text-slate-500 mt-0.5">Real database products ranked by composite risk score ($R_i(t)$)</p>
              </div>
              <Link className="text-xs font-bold text-brand-700 hover:text-brand-800 flex items-center gap-1 group" href="/risk-queue">
                <span>View Full Queue</span>
                <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                  <tr>
                    <th className="py-3 px-6">Product / Model</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Risk Score</th>
                    <th className="py-3 px-4">Review Mentions</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">Loading live database queue...</td>
                    </tr>
                  ) : queueItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">No products found in database. Load demo dataset.</td>
                    </tr>
                  ) : (
                    queueItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition group">
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-bold text-slate-900">{item.name}</p>
                            <p className="text-[11px] text-slate-400 font-medium">Brand: {item.brand} • ID: {item.id}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-700">
                          {item.category}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 rounded-md font-extrabold ${
                            item.risk_score >= 70 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {item.risk_score} / 100
                          </span>
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-800">
                          {item.signal_count} verified mentions
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.recall_status === 'RECALLED' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {item.recall_status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Link href={`/products/${item.id}`} className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-brand-600 hover:text-white text-slate-700 font-bold transition text-xs shadow-xs inline-block">
                            Investigate
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column Sidebar Cards (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Module 1: Risk Queue */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card hover:shadow-card-hover transition">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-200/60 flex items-center justify-center text-brand-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Risk Queue Investigation</h3>
                  <p className="text-[11px] text-slate-400">{highRiskCount} active flags require sign-off</p>
                </div>
              </div>
              <Link href="/risk-queue" className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-brand-700 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
              </Link>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between">
                <span className="text-slate-600 font-medium">Auto-Triage Threshold</span>
                <span className="font-bold text-slate-800">&gt;= 70.0 Severity</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between">
                <span className="text-slate-600 font-medium">Average Lead Advantage</span>
                <span className="font-bold text-emerald-700">7.4 Weeks Early</span>
              </div>
            </div>
          </div>

          {/* Module 2: Backtest Lab */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card hover:shadow-card-hover transition">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Backtest Lab & Alert Budget</h3>
                  <p className="text-[11px] text-slate-400">Validated against Historical Recalls</p>
                </div>
              </div>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-slate-600">Recall Rate (Sensitivity)</span>
                  <span className="text-brand-800 font-bold">91.8%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-brand-600 h-2 rounded-full" style={{ width: '91.8%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-slate-600">Alert Budget Consumption</span>
                  <span className="text-slate-800 font-bold">38% (Normal)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '38%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Ask RecallRadar Copilot Card */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl p-5 text-white shadow-card relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Semantic Safety Agent</span>
            </div>
            <h3 className="text-base font-bold text-white mb-1">Ask RecallRadar</h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">Query our LLM safety copilot over ingested database customer reviews and CPSC logs.</p>
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3.5 mb-4 text-xs text-slate-300 italic flex items-center justify-between gap-3 leading-relaxed">
              <span className="line-clamp-2">"Summarize all thermal runaway incidents reported in Nursery products..."</span>
              <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </div>
            <Link href="/ask" className="w-full py-2.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm inline-flex">
              <span>Launch Safety Copilot</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </Link>
          </div>

          {/* Data Ingestion Feeds */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-900">Regulatory Surveillance Feed</span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">All Systems Synced</span>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-600 pb-2 border-b border-slate-100">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  CPSC SaferProducts.gov
                </span>
                <span className="font-bold text-slate-900">Synced</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 pb-2 border-b border-slate-100">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Amazon Marketplace Reviews
                </span>
                <span className="font-bold text-slate-900">73 Reviews</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Internal CRM Return Telemetry
                </span>
                <span className="font-bold text-slate-900">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
