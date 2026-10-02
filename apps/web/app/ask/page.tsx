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

function renderInlineFormatting(str: string, isUser: boolean = false) {
  const parts = str.split(/(\*\*.*?\*\*|\*.*?\*|\[[A-Za-z0-9_-]+\])/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className={`font-bold ${isUser ? 'text-white' : 'text-slate-900'}`}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <span key={i} className={`font-semibold ${isUser ? 'text-brand-100 underline' : 'text-rose-700 bg-rose-50 px-1 py-0.2 rounded border border-rose-100'}`}>
          {part.slice(1, -1)}
        </span>
      );
    }
    if (part.startsWith('[') && part.endsWith(']')) {
      return (
        <span key={i} className={`inline-block px-1.5 py-0.2 rounded font-mono text-[10px] font-bold border ${isUser ? 'bg-white/20 text-white border-white/30' : 'bg-slate-100 text-slate-800 border-slate-200'}`}>
          {part}
        </span>
      );
    }
    return part;
  });
}

function FormattedMessageText({ text, isUser = false }: { text: string; isUser?: boolean }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-0.5" />;

        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className={`text-sm font-bold border-b pb-1 pt-1 ${isUser ? 'text-white border-white/20' : 'text-slate-900 border-slate-100'}`}>
              {trimmed.replace(/^###\s+/, '')}
            </h3>
          );
        }

        if (trimmed.startsWith('- ')) {
          const content = trimmed.replace(/^-\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-2 text-xs">
              <span className={`font-bold shrink-0 ${isUser ? 'text-white' : 'text-brand-600'}`}>•</span>
              <div className={`leading-relaxed ${isUser ? 'text-white' : 'text-slate-700'}`}>{renderInlineFormatting(content, isUser)}</div>
            </div>
          );
        }

        return (
          <p key={idx} className={`text-xs leading-relaxed ${isUser ? 'text-white' : 'text-slate-700'}`}>
            {renderInlineFormatting(trimmed, isUser)}
          </p>
        );
      })}
    </div>
  );
}

export default function AskEarlyEchoPage() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'rag' | 'ai_chat'>('rag');
  const [chatModeOption, setChatModeOption] = useState<'ask' | 'improvement'>('ask');
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
    const activeSubMode = activeMode === 'ai_chat' ? chatModeOption : 'ask';
    const userMsg = q.trim() || (activeSubMode === 'improvement'
      ? `Generate improvement blueprint for product ASIN ${selectedAsin}`
      : `Analyze product ASIN ${selectedAsin}`);

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
          sub_mode: activeSubMode,
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
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 select-none">
            <button
              onClick={() => {
                setMode('rag');
                setChatModeOption('ask');
              }}
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
              <FormattedMessageText text={m.text} isUser={m.sender === 'user'} />

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
                    {Array.from(new Set(m.citations)).map((c, cIdx) => (
                      <div key={cIdx} className="text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/70 font-mono text-[11px] leading-relaxed">
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
            <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
            <span>
              {mode === 'ai_chat'
                ? (chatModeOption === 'improvement'
                    ? 'NVIDIA NIM synthesizing genuine product improvement blueprint from real reviews... (please wait a few seconds)'
                    : 'NVIDIA NIM investigator reasoning through defect history...')
                : 'Executing SQL tool over database...'}
            </span>
          </div>
        )}
      </div>

      {/* Mode Control & Notice Bar Above Input */}
      {mode === 'ai_chat' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">Copilot Mode:</span>
            <select
              value={chatModeOption}
              onChange={(e) => setChatModeOption(e.target.value as 'ask' | 'improvement')}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm cursor-pointer"
            >
              <option value="ask">Ask (Grounded Safety Q&amp;A)</option>
              <option value="improvement">Improvement (Actionable Product Blueprint)</option>
            </select>
          </div>

          {chatModeOption === 'improvement' && (
            <span className="text-[11px] text-purple-700 font-medium bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 flex items-center gap-1.5">
              <span>⏳</span>
              <span>Takes longer to respond — performing deep generative synthesis from real reviews.</span>
            </span>
          )}
        </div>
      )}

      {/* Input Box */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-card flex items-center gap-2">
        {mode === 'ai_chat' && (
          <div className="hidden sm:block shrink-0">
            <select
              value={chatModeOption}
              onChange={(e) => setChatModeOption(e.target.value as 'ask' | 'improvement')}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ask">🎯 Ask</option>
              <option value="improvement">💡 Improvement</option>
            </select>
          </div>
        )}

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={
            mode === 'ai_chat'
              ? (chatModeOption === 'improvement'
                  ? 'Enter product ASIN/ID for Actionable Improvement Guide, e.g. "B0002CZV82"'
                  : 'Ask investigator to reason through a defect, e.g. "Why is B0002CZV82 critical and how does it compare to peers?"')
              : 'Query database tables, e.g. "Show top 5 risk products with safety signals in a table"'
          }
          className="flex-1 text-xs sm:text-sm px-3 py-2 bg-transparent focus:outline-none text-slate-800 placeholder-slate-400"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || (!query.trim() && !selectedAsin)}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition flex items-center gap-1.5 disabled:opacity-40 ${
            mode === 'ai_chat'
              ? (chatModeOption === 'improvement' ? 'bg-purple-700 hover:bg-purple-800' : 'bg-indigo-600 hover:bg-indigo-700')
              : 'bg-brand-700 hover:bg-brand-800'
          }`}
        >
          <span>{chatModeOption === 'improvement' && mode === 'ai_chat' ? 'Synthesize' : 'Send'}</span>
          <span>&rarr;</span>
        </button>
      </div>
    </div>
  );
}
