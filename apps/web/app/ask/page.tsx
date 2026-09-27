'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { getApiUrl } from '../../lib/api';

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  mode?: 'rag' | 'ai_chat';
  table?: {
    columns: string[];
    rows: any[][];
  } | null;
  citations?: string[];
  productDetail?: {
    id: string;
    name: string;
    brand?: string;
    category?: string;
    risk_score: number;
    signals?: string[];
  } | null;
  similarProducts?: Array<{
    id: string;
    name: string;
    brand: string;
    risk_score: number;
    signal_count: number;
    review_count: number;
  }>;
}

export default function AskEarlyEchoPage() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'rag' | 'ai_chat'>('rag');
  const [selectedAsin, setSelectedAsin] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'assistant',
      mode: 'rag',
      text: 'Hello! I am EarlyEcho AI Safety Copilot. Use the toggle above to switch between Grounded RAG mode (direct database queries & citations) and AI Chat mode (investigative reasoning powered by NVIDIA NIM).',
    },
  ]);

  const handleSend = async (textToSend?: string, overrideMode?: 'rag' | 'ai_chat') => {
    const q = textToSend || query;
    if (!q.trim() && !selectedAsin) return;

    const activeMode = overrideMode || mode;
    const userMsg = q.trim() || `Analyze product ASIN ${selectedAsin}`;
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg, mode: activeMode }]);
    if (!textToSend) setQuery('');
    setLoading(true);

    try {
      const res = await fetch(getApiUrl('/api/v1/chat/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMsg,
          mode: activeMode,
          product_id: selectedAsin || undefined
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            sender: 'assistant',
            mode: activeMode,
            text: data.answer || 'No relevant evidence found in database.',
            table: data.table || null,
            citations: data.citations || [],
            productDetail: data.product_detail || null,
            similarProducts: data.similar_products || [],
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'assistant',
            mode: activeMode,
            text: 'Error processing your request. Please try again.',
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          mode: activeMode,
          text: 'Unable to connect to backend intelligence search service.',
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
    link.setAttribute('download', `earlyecho_query_export_${idx}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header with Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Ask EarlyEcho AI</h1>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
              mode === 'ai_chat' ? 'text-indigo-800 bg-indigo-100 border-indigo-200' : 'text-emerald-800 bg-emerald-100 border border-emerald-200'
            }`}>
              {mode === 'ai_chat' ? 'NVIDIA NIM Copilot' : 'Grounded RAG Mode'}
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            {mode === 'ai_chat'
              ? 'Conversational safety investigator reasoning through defect history, citations, and category comparisons.'
              : 'Deterministic grounded Q&A with whitelisted SQL tools and direct evidence citations.'}
          </p>
        </div>

        {/* Mode Selector Pill Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 select-none">
          <button
            onClick={() => setMode('rag')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              mode === 'rag' ? 'bg-white text-brand-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            🔍 RAG Mode
          </button>
          <button
            onClick={() => setMode('ai_chat')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              mode === 'ai_chat' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            🤖 AI Chat (NVIDIA NIM)
          </button>
        </div>
      </div>

      {/* Product Drill-Down Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="font-bold text-slate-700 whitespace-nowrap">Product Drill-down:</span>
          <input
            type="text"
            placeholder="Enter ASIN (e.g. B0002CZV82)"
            value={selectedAsin}
            onChange={(e) => setSelectedAsin(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg font-mono text-xs w-full sm:w-48 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-slate-400 font-medium whitespace-nowrap">Quick samples:</span>
          {['B0002CZV82', 'B0002D0B4K', 'B000165DSM'].map((sample) => (
            <button
              key={sample}
              onClick={() => {
                setSelectedAsin(sample);
                handleSend(`Investigate defects and compare product ${sample}`, mode);
              }}
              className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-mono text-[11px] rounded-md border border-slate-200 whitespace-nowrap"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Feed */}
      <div className="space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-3xl rounded-2xl p-5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                m.sender === 'user'
                  ? 'bg-brand-700 text-white font-medium'
                  : 'bg-white border border-slate-200/80 text-slate-800'
              }`}
            >
              <div className="whitespace-pre-line">{m.text}</div>

              {/* Product Drill-Down Detail Card */}
              {m.productDetail && (
                <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50 p-3.5 rounded-xl border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 text-xs">{m.productDetail.name}</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                      Hazard Score: {m.productDetail.risk_score} / 100
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">ASIN: {m.productDetail.id}</span>
                </div>
              )}

              {/* Similar Products Peer Comparison Table */}
              {m.similarProducts && m.similarProducts.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Catalog Peer Comparison
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {m.similarProducts.map((p) => (
                      <div key={p.id} className="p-2.5 rounded-lg bg-white border border-slate-200 text-[11px] flex justify-between items-center">
                        <div className="truncate mr-2">
                          <span className="font-bold text-slate-800 block truncate">{p.name}</span>
                          <span className="text-slate-400 font-mono text-[10px]">{p.brand}</span>
                        </div>
                        <span className="font-mono font-bold text-slate-700 shrink-0">
                          {p.risk_score} Score
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interactive SQL Table Output (RAG Mode) */}
              {m.table && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      SQL Result Telemetry
                    </span>
                    <button
                      onClick={() => handleDownloadCSV(m.table!, idx)}
                      className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] font-bold rounded border border-slate-200 flex items-center gap-1 transition"
                    >
                      <span>Download CSV</span>
                      <span>&darr;</span>
                    </button>
                  </div>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                          {m.table.columns.map((c, i) => (
                            <th key={i} className="py-2 px-3">{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                        {m.table.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50/80">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="py-1.5 px-3 whitespace-nowrap">{String(cell)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Grounded Evidence Citations */}
              {m.citations && m.citations.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px]">
                  <span className="text-slate-400 font-semibold block mb-1">Evidence Citations:</span>
                  <div className="space-y-1">
                    {m.citations.map((c, cIdx) => (
                      <div key={cIdx} className="text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 p-4 bg-white border border-slate-200/80 rounded-2xl w-fit shadow-sm text-xs text-slate-500">
            <span className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></span>
            <span>{mode === 'ai_chat' ? 'NVIDIA NIM investigator reasoning...' : 'Executing SQL tool over database...'}</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-card flex items-center gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={
            mode === 'ai_chat'
              ? 'Ask investigator to reason through a defect, e.g. "Why is B0002CZV82 critical and how does it compare to peers?"'
              : 'Query database tables, e.g. "Show top 5 risk products with safety signals in a table"'
          }
          className="flex-1 text-xs sm:text-sm px-3 py-2 bg-transparent focus:outline-none text-slate-800 placeholder-slate-400"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || (!query.trim() && !selectedAsin)}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition flex items-center gap-1.5 disabled:opacity-40 ${
            mode === 'ai_chat' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-brand-700 hover:bg-brand-800'
          }`}
        >
          <span>Send</span>
          <span>&rarr;</span>
        </button>
      </div>
    </div>
  );
}
