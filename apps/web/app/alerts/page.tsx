'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '../../lib/api';

export default function AlertsPage() {
  const [ruleInput, setRuleInput] = useState('');
  const [rules, setRules] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAlertsAndRules();
  }, []);

  const fetchAlertsAndRules = async () => {
    setLoading(true);
    try {
      const [alertsRes, rulesRes] = await Promise.all([
        fetch(getApiUrl('/api/v1/alerts/')).then(r => r.json()).catch(() => []),
        fetch(getApiUrl('/api/v1/alerts/rules')).then(r => r.json()).catch(() => [])
      ]);
      setAlerts(Array.isArray(alertsRes) ? alertsRes : []);
      setRules(Array.isArray(rulesRes) ? rulesRes : []);
    } catch (e) {
      console.error('Error fetching alerts:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleInput.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(getApiUrl('/api/v1/alerts/rules'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: ruleInput.trim() }),
      });
      const data = await res.json();
      if (data.rule) {
        setRules((prev) => [data.rule, ...prev]);
        setRuleInput('');
      }
    } catch (err) {
      console.error('Error creating rule:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Critical Priority Alerts &amp; Rule Engine</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 whitespace-nowrap">
              {alerts.length} Active System Alerts
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed">
            Automated severity threshold triggers and natural language rule interpretation engine.
          </p>
        </div>
      </div>

      {/* Natural Language Rule Creator */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 rounded-2xl p-6 text-white shadow-card-hover">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="text-xs font-bold text-brand-200 uppercase tracking-wider">Natural Language Alert Engine</span>
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Create Custom Safety Alert Rule</h2>
        <p className="text-xs text-brand-100 mb-4 leading-relaxed">
          Type rules in plain English. RecallRadar translates your intent into structured temporal filters and threshold triggers.
        </p>

        <form onSubmit={handleAddRule} className="flex flex-col sm:flex-row items-center gap-3">
          <input 
            type="text"
            value={ruleInput}
            onChange={(e) => setRuleInput(e.target.value)}
            placeholder="e.g. alert me if burn or fire mentions double in two weeks"
            className="flex-1 w-full bg-white/15 border border-white/20 text-white placeholder-brand-200 text-xs rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 font-medium"
          />
          <button 
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-5 py-3 bg-white text-brand-900 hover:bg-brand-50 text-xs font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
          >
            <span>{submitting ? 'Parsing & Compiling...' : 'Save & Compile Rule'}</span>
            <span>&rarr;</span>
          </button>
        </form>
      </div>

      {/* Active Rules & Triggered Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Configured Rules */}
        <div className="lg:col-span-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900">Active Database Rules ({rules.length})</h2>
          {loading ? (
            <div className="p-6 text-center text-slate-400 text-xs">Loading alert rules...</div>
          ) : rules.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">No active alert rules configured. Create one above.</div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule, idx) => (
                <div key={rule.id || idx} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-card flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-200/60 flex items-center justify-center text-brand-700 font-bold text-xs">
                      R{idx + 1}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{rule.name || rule.description}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Type: {rule.rule_type || 'Threshold'} • Status: Compiled & Active</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 whitespace-nowrap">
                    ACTIVE
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Triggered Anomaly Alerts */}
        <div className="lg:col-span-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900">Triggered System Alerts ({alerts.length})</h2>
          {loading ? (
            <div className="p-6 text-center text-slate-400 text-xs">Loading active alerts...</div>
          ) : alerts.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">No active alerts triggered in database.</div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alertItem, idx) => (
                <div key={alertItem.id || idx} className={`bg-white border rounded-2xl p-4 shadow-card ${
                  alertItem.risk_score >= 70 ? 'border-rose-200' : 'border-slate-200/80'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      alertItem.risk_score >= 70 ? 'text-rose-700 bg-rose-50 border-rose-200' : 'text-amber-700 bg-amber-50 border-amber-200'
                    }`}>
                      {alertItem.confidence || 'HIGH'} SEVERITY
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">{alertItem.triggered_at}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{alertItem.product_name}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {alertItem.explanation || `Risk score ${alertItem.risk_score}/100 exceeded active threshold for ${alertItem.category}.`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
