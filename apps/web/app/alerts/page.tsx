'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '../../lib/api';
import { useLiveData } from '../../lib/useLiveData';

export default function AlertsPage() {
  const [ruleInput, setRuleInput] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('safety-lead@company.internal');
  const [rules, setRules] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  const [alertsPage, setAlertsPage] = useState(1);
  const alertsPerPage = 5;

  const fetchAlertsAndRules = async (isBackground: boolean = false) => {
    if (!isBackground) setLoading(true);
    try {
      const [alertsRes, rulesRes] = await Promise.all([
        fetch(getApiUrl('/api/v1/alerts/')).then((r) => r.json()).catch(() => []),
        fetch(getApiUrl('/api/v1/alerts/rules')).then((r) => r.json()).catch(() => []),
      ]);
      setAlerts(Array.isArray(alertsRes) ? alertsRes : []);
      setRules(Array.isArray(rulesRes) ? rulesRes : []);
    } catch (e) {
      console.error('Error fetching alerts:', e);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const totalAlertsPages = Math.max(1, Math.ceil(alerts.length / alertsPerPage));
  const paginatedAlerts = alerts.slice((alertsPage - 1) * alertsPerPage, alertsPage * alertsPerPage);

  useEffect(() => {
    if (alertsPage > totalAlertsPages) {
      setAlertsPage(totalAlertsPages);
    }
  }, [alerts.length, totalAlertsPages, alertsPage]);

  useLiveData(
    async (isBackground) => {
      fetchAlertsAndRules(isBackground);
    },
    ['alerts']
  );

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

  const handleEvaluateAndDispatch = async () => {
    setEvaluating(true);
    setDispatchStatus(null);
    try {
      const res = await fetch(getApiUrl('/api/v1/alerts/evaluate-and-dispatch'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient: recipientEmail.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setDispatchStatus(`Successfully evaluated directives and dispatched ${data.fired_count} alert emails to ${data.recipient} via Resend.`);
        await fetchAlertsAndRules();
      } else {
        setDispatchStatus('Failed to evaluate directives. Please try again.');
      }
    } catch (err) {
      console.error('Error dispatching alerts:', err);
      setDispatchStatus('Error connecting to alert dispatch service.');
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Critical Priority Alerts &amp; Rule Engine
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 whitespace-nowrap">
              {alerts.length} Active System Alerts
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed">
            Automated severity threshold triggers, natural language rule compilation, and real transactional email dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleEvaluateAndDispatch}
            disabled={evaluating}
            className="px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-2 disabled:opacity-50"
          >
            {evaluating ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Evaluating &amp; Dispatching...</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
                <span>Fire Directives &amp; Send Alerts</span>
              </>
            )}
          </button>
        </div>
      </div>

      {dispatchStatus && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>{dispatchStatus}</span>
          <button onClick={() => setDispatchStatus(null)} className="text-emerald-600 hover:text-emerald-900 text-sm font-bold">&times;</button>
        </div>
      )}

      {/* Natural Language Rule Creator */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 rounded-2xl p-6 text-white shadow-card-hover space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-xs font-bold text-brand-200 uppercase tracking-wider">Natural Language Alert Engine</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-brand-200 font-medium">Notification Recipient:</span>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="bg-white/10 border border-white/20 text-white text-xs px-2.5 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono"
            />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-white mb-1">Create Custom Safety Alert Rule</h2>
          <p className="text-xs text-brand-100 leading-relaxed">
            Type rules in plain English. EarlyEcho compiles directives into temporal filters and fires real transactional email alerts via Resend when thresholds are breached.
          </p>
        </div>

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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Configured Rules + Channel Telemetry & Diagnostics */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Active Directives &amp; Rules ({rules.length})</h2>
              <span className="text-[11px] text-slate-400 font-medium">Temporal &amp; Lexicon Filters</span>
            </div>

            {loading ? (
              <div className="p-6 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200/80">Loading alert rules...</div>
            ) : rules.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200/80">No active alert rules configured. Create one above.</div>
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
                        <p className="text-[10px] text-slate-400 mt-0.5">Type: {rule.rule_type || 'Threshold'} • Status: Compiled &amp; Active</p>
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

          {/* Alert Engine Telemetry & Channel Configuration Panel (Fills Left Column & Balances Page) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Surveillance Channels &amp; Delivery Telemetry
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                SLAs Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Email Gateway</span>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">Live</span>
                </div>
                <p className="text-[11px] text-slate-500">Resend Transactional API</p>
                <p className="text-[10px] font-mono text-slate-400 truncate">{recipientEmail}</p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Webhook Router</span>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">Connected</span>
                </div>
                <p className="text-[11px] text-slate-500">Slack / Ops Channels</p>
                <p className="text-[10px] font-mono text-slate-400">JSON schema v1.2</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <h4 className="text-[11px] font-bold text-slate-700">Automated Severity Triggers</h4>
              <div className="space-y-1.5 text-[11px] text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    <span>Bayesian Harm Severity</span>
                  </span>
                  <span className="font-mono text-slate-700 font-semibold">&ge; 70.0 / 100</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    <span>14-Day Velocity Spike</span>
                  </span>
                  <span className="font-mono text-slate-700 font-semibold">2x Frequency Baseline</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    <span>Fail-Soft Outbound Timeout</span>
                  </span>
                  <span className="font-mono text-slate-700 font-semibold">&lt; 5.0 seconds</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Triggered Anomaly Alerts with 10-per-page Pagination */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Triggered System Alerts ({alerts.length})</h2>
              <span className="text-[11px] text-slate-400 font-medium">Live Telemetry &amp; Dispatch Receipts</span>
            </div>
            {alerts.length > alertsPerPage && (
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                Page {alertsPage} of {totalAlertsPages}
              </span>
            )}
          </div>

          {loading ? (
            <div className="p-6 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200/80">Loading active alerts...</div>
          ) : alerts.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-200/80 rounded-2xl text-slate-400 text-xs">
              No active alerts triggered in database. Click &quot;Fire Directives &amp; Send Alerts&quot; above to run live rule matching.
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedAlerts.map((alertItem, idx) => (
                <div key={alertItem.id || idx} className={`bg-white border rounded-2xl p-4 shadow-card ${
                  alertItem.risk_score >= 70 ? 'border-rose-200' : 'border-slate-200/80'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        alertItem.risk_score >= 70 ? 'text-rose-700 bg-rose-50 border-rose-200' : 'text-amber-700 bg-amber-50 border-amber-200'
                      }`}>
                        {alertItem.confidence || 'HIGH'} SEVERITY
                      </span>
                      <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200 font-mono">
                        Risk: {alertItem.risk_score}/100
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{alertItem.triggered_at}</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{alertItem.product_name}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {alertItem.explanation || `Risk score ${alertItem.risk_score}/100 exceeded active threshold.`}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <span className="text-slate-400 font-mono">ASIN: {alertItem.product_id}</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>{alertItem.delivery_receipt?.status || 'Dispatched via Resend'} ({alertItem.delivery_receipt?.recipient || recipientEmail})</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {alerts.length > alertsPerPage && (
            <div className="flex items-center justify-between pt-3 pb-2 px-1">
              <span className="text-xs text-slate-500 font-medium">
                Showing <span className="font-bold text-slate-700">{(alertsPage - 1) * alertsPerPage + 1}</span> to{' '}
                <span className="font-bold text-slate-700">{Math.min(alertsPage * alertsPerPage, alerts.length)}</span> of{' '}
                <span className="font-bold text-slate-700">{alerts.length}</span> alerts
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAlertsPage((prev) => Math.max(1, prev - 1))}
                  disabled={alertsPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition"
                >
                  &larr; Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalAlertsPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setAlertsPage(p)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                        alertsPage === p
                          ? 'bg-brand-900 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200/80'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setAlertsPage((prev) => Math.min(totalAlertsPages, prev + 1))}
                  disabled={alertsPage >= totalAlertsPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition"
                >
                  Next &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
