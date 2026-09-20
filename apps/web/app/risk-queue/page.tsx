'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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

export default function RiskQueuePage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [minRisk, setMinRisk] = useState<number>(0);
  const [category, setCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('highest_risk');

  useEffect(() => {
    fetchQueueData();
  }, [minRisk, category, sortBy]);

  const fetchQueueData = async () => {
    setLoading(true);
    try {
      let url = `http://localhost:8000/api/v1/risk-queue/?sort_by=${sortBy}&min_risk=${minRisk}`;
      if (category) url += `&category=${category}`;
      const res = await fetch(url);
      const data = await res.json();
      setItems(data.items || []);
    } catch (e) {
      console.error('Error fetching risk queue data from backend:', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Live Risk Queue & Citation Diagnostics</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
              4 Critical In Queue
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1 font-medium">
            Ranked by Bayesian harm probability, linguistic clustering severity, and return-code velocity.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <button className="px-3.5 py-1.5 bg-brand-700 text-white rounded-xl shadow-xs">All Products</button>
          <button className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition">High Severity</button>
          <button className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition">Unacknowledged</button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-card flex flex-wrap items-center gap-5 text-xs font-semibold text-slate-700">
        <div>
          <label className="text-slate-500 block mb-1 text-[11px] font-bold uppercase tracking-wider">Minimum Risk Score</label>
          <input 
            type="number" 
            min="0" 
            max="100" 
            value={minRisk} 
            onChange={(e) => setMinRisk(Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-900 font-bold w-28 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div>
          <label className="text-slate-500 block mb-1 text-[11px] font-bold uppercase tracking-wider">Category</label>
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Toys">Toys</option>
            <option value="Baby Products">Baby Products</option>
            <option value="Home Appliances">Home Appliances</option>
          </select>
        </div>

        <div>
          <label className="text-slate-500 block mb-1 text-[11px] font-bold uppercase tracking-wider">Sort By</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="highest_risk">Highest Hazard Index</option>
            <option value="most_signals">Most Safety Citations</option>
            <option value="largest_lead_time">Largest Early Warning Horizon</option>
          </select>
        </div>
      </div>

      {/* Risk Queue Cards Grid (Stitch Style with Fixed Badge Typography) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center p-12 text-slate-400 font-medium">Loading risk queue diagnostics...</div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-card hover:shadow-card-hover transition relative flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <span className={`inline-block text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                      item.risk_score >= 90 
                        ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {item.risk_score >= 90 ? 'CRITICAL DEFECT' : 'HIGH SEVERITY'}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 mt-2 leading-snug tracking-tight">{item.name}</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-1 truncate">{item.brand}</p>
                  </div>
                  
                  {/* Fixed Typography Hazard Index Badge */}
                  <div className={`min-w-[58px] h-14 px-2 rounded-2xl flex flex-col items-center justify-center font-black text-white shadow-sm shrink-0 ${
                    item.risk_score >= 90 ? 'bg-rose-600 shadow-rose-600/25' : 'bg-amber-500 shadow-amber-500/25'
                  }`}>
                    <span className="text-lg font-black leading-none tracking-tight">{item.risk_score}</span>
                    <span className="text-[8px] font-bold uppercase tracking-tighter opacity-95 mt-0.5 whitespace-nowrap">Hazard Index</span>
                  </div>
                </div>

                <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-100 mb-4">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                    <span className="text-rose-500 font-bold">⚠</span> Dominant Incident Cluster:
                  </div>
                  <p className="text-xs text-slate-700 italic font-medium leading-relaxed">
                    "{item.latest_signal}"
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Verified Customer Evidence</span>
                    <span className="font-extrabold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200/60">
                      {item.signal_count} similar citations
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Lead Window</span>
                    <span className="text-xs font-extrabold text-emerald-700">{item.lead_time_weeks || 7.4} wks ahead</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Return Velocity</span>
                    <span className="text-xs font-extrabold text-rose-600">{item.trend || '+318% MoM'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Assigned: Safety Committee</span>
                <Link
                  href={`/products/${item.id}`}
                  className="font-bold text-brand-700 hover:text-brand-800 flex items-center gap-1 group"
                >
                  <span>Inspect Case</span>
                  <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
