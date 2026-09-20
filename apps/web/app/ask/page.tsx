'use client';

import { useState } from 'react';

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  citations?: string[];
  isFallback?: boolean;
}

export default function AskRecallRadarPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'assistant',
      text: 'Hello! I am RecallRadar AI Safety Copilot. I analyze product reviews, CPSC complaints, and return codes using grounded database retrieval. Ask me any question about thermal hazards, mechanical defects, or safety trends.',
    },
  ]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMsg = query;
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setQuery('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/v1/ask/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: data.answer || 'No relevant evidence found in database for your query.',
          citations: data.citations || [],
          isFallback: data.is_fallback,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'Unable to connect to backend database service. Please check API server.',
          citations: [],
          isFallback: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Ask RecallRadar</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full text-emerald-800 bg-emerald-100">
              Grounded AI RAG Copilot
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Query customer testimonials and CPSC complaint logs stored in the database. All responses strictly cite internal database review evidence.
          </p>
        </div>
      </div>

      {/* Chat Messages Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-card min-h-[420px] flex flex-col justify-between space-y-4">
        <div className="space-y-4 overflow-y-auto max-h-[480px] pr-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-brand-700 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm">
                  RR
                </div>
              )}
              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-brand-700 text-white font-medium'
                    : 'bg-slate-50 border border-slate-200/80 text-slate-800'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Citations:</span>
                    {msg.citations.map((c, i) => (
                      <span key={i} className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
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
              <span>Searching vector database & synthesizing response...</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="flex items-center gap-3 pt-4 border-t border-slate-100">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question (e.g. Which heater batch numbers correlate with thermal cut-off failures?)"
            className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-xs rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-medium"
          />
          <button
            type="submit"
            className="px-5 py-3 bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <span>Ask AI</span>
            <span>&rarr;</span>
          </button>
        </form>
      </div>
    </div>
  );
}
