'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { getApiUrl } from '../../lib/api';

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  table?: {
    columns: string[];
    rows: any[][];
  } | null;
  citations?: string[];
}

export default function AskRecallRadarPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'assistant',
      text: 'Hello! I am RecallRadar SQL AI Safety Copilot. I execute whitelisted SQL tools over PostgreSQL to analyze review telemetry, defect signals, and product hazards. How can I help you today?',
    },
  ]);

  const handleSend = async (textToSend?: string) => {
    const q = textToSend || query;
    if (!q.trim()) return;

    const userMsg = q.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    if (!textToSend) setQuery('');
    setLoading(true);

    try {
      const res = await fetch(getApiUrl('/api/v1/chat/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            sender: 'assistant',
            text: data.answer || 'No relevant evidence found in database.',
            table: data.table || null,
            citations: data.citations || [],
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'assistant',
            text: 'Error processing your request. Please try again.',
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'Unable to connect to backend SQL search service.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = (table: { columns: string[]; rows: any[][] }, idx: number) => {
    const headerRow = table.columns.join(',');
    const bodyRows = table.rows
      .map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headerRow + '\n' + bodyRows);

    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `recallradar_query_export_${idx}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Ask RecallRadar AI</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full text-emerald-800 bg-emerald-100 border border-emerald-200">
              NVIDIA NIM SQL Tool Agent
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Grounded SQL function calling over PostgreSQL DB. Every insight cites database review evidence and exportable table queries.
          </p>
        </div>

        {/* Quick Sample Prompts */}
        <div className="flex flex-wrap gap-2 text-xs font-medium">
          <button
            onClick={() => handleSend('Show products with top risk defects in a table')}
            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition"
          >
            📊 Top Risk Products Table
          </button>
          <button
            onClick={() => handleSend('Show table of cable noise reports')}
            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition"
          >
            🔌 Cable Noise Reports
          </button>
        </div>
      </div>

      {/* Chat Container */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-card min-h-[480px] flex flex-col justify-between space-y-4">
        <div className="space-y-6 overflow-y-auto max-h-[520px] pr-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-brand-700 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm mt-1">
                  RR
                </div>
              )}

              <div
                className={`max-w-3xl rounded-2xl p-4 text-xs leading-relaxed space-y-3 ${
                  msg.sender === 'user'
                    ? 'bg-brand-700 text-white font-medium self-end'
                    : 'bg-slate-50 border border-slate-200/80 text-slate-800'
                }`}
              >
                <div className="whitespace-pre-line text-xs font-sans leading-normal">
                  {msg.text}
                </div>

                {/* Structured Table Response with CSV Export */}
                {msg.table && msg.table.rows && msg.table.rows.length > 0 && (
                  <div className="mt-3 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="p-2.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-700">SQL Tool Execution Result</span>
                      <button
                        onClick={() => handleDownloadCSV(msg.table!, idx)}
                        className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-brand-700 font-extrabold hover:bg-brand-50 transition flex items-center gap-1 shadow-2xs"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                        Export CSV
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                            {msg.table.columns.map((col, cIdx) => (
                              <th key={cIdx} className="py-2 px-3">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {msg.table.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50/60 transition">
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="py-2 px-3 max-w-[200px] truncate" title={String(cell)}>
                                  {String(cell)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Citations Footer */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/60 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Citations:</span>
                    {msg.citations.map((c, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 font-mono"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-slate-400 text-xs italic">
              <div className="w-8 h-8 rounded-xl bg-brand-700 text-white flex items-center justify-center font-bold text-xs animate-pulse">
                RR
              </div>
              <span>Executing SQL tools &amp; formatting response...</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-3 pt-4 border-t border-slate-100"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question (e.g. Show table of top risk products or cable noise reports)"
            className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-xs rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-medium"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-3 bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <span>Ask AI</span>
            <span>&rarr;</span>
          </button>
        </form>
      </div>
    </div>
  );
}
