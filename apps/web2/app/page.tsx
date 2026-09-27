'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

interface ProductItem {
  id: string;
  name: string;
  brand?: string;
  category?: string;
}

interface RecentReviewItem {
  id: string;
  external_id?: string;
  product_name: string;
  product_brand?: string;
  rating: number;
  title?: string;
  body: string;
  sentiment: string;
  source: string;
  review_date: string;
  signals: { signal_type: string; phrase: string; severity: number }[];
}

interface StatsData {
  total_reviews: number;
  positive_reviews: number;
  negative_reviews: number;
  total_safety_signals: number;
  db_status: string;
}

export default function Web2ReviewPortal() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('NEW');
  const [productName, setProductName] = useState<string>('');
  const [brand, setBrand] = useState<string>('');
  const [category, setCategory] = useState<string>('Musical Instruments');

  const [rating, setRating] = useState<number>(5);
  const [title, setTitle] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [reviewerName, setReviewerName] = useState<string>('Verified Purchaser');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [resultMessage, setResultMessage] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [recentReviews, setRecentReviews] = useState<RecentReviewItem[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loadingFeed, setLoadingFeed] = useState<boolean>(true);

  useEffect(() => {
    fetchProducts();
    fetchLiveFeed();
    fetchStats();

    // Auto-refresh feed every 3.5 seconds for instant real-time sync
    const interval = setInterval(() => {
      fetchLiveFeed();
      fetchStats();
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await apiFetch('/api/v1/products?page_size=50');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
        if (data.length > 0) {
          setSelectedProductId(data[0].id);
          setProductName(data[0].name);
          setBrand(data[0].brand || '');
        }
      }
    } catch (e) {
      console.error('Failed to load products', e);
    }
  };

  const fetchLiveFeed = async () => {
    try {
      const res = await apiFetch('/api/v1/reviews/recent?limit=20');
      if (res.ok) {
        const data = await res.json();
        setRecentReviews(data.items || []);
      }
    } catch (e) {
      console.error('Failed to load recent reviews feed', e);
    } finally {
      setLoadingFeed(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await apiFetch('/api/v1/reviews/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Failed to load stats', e);
    }
  };

  const handleProductSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedProductId(val);
    if (val === 'NEW') {
      setProductName('');
      setBrand('');
    } else {
      const found = products.find((p) => p.id === val);
      if (found) {
        setProductName(found.name);
        setBrand(found.brand || '');
      }
    }
  };

  const handlePresetSample = (type: 'positive' | 'hazard_fire' | 'defect_shock') => {
    setErrorMessage(null);
    setResultMessage(null);
    if (type === 'positive') {
      setRating(5);
      setTitle('Absolute perfection and super sound quality!');
      setBody('I have been using this instrument daily for weeks. The tone is rich, build quality is solid, and it works flawlessly without overheating or any electrical issues.');
    } else if (type === 'hazard_fire') {
      setRating(1);
      setTitle('DANGER! Adapter overheated, smoked, and caught fire!');
      setBody('WARNING to everyone: I plugged this in for 15 minutes, smelled burning plastic, saw thick smoke coming out, and then the power adapter caught fire! Left a painful burn on my hand.');
    } else if (type === 'defect_shock') {
      setRating(2);
      setTitle('Electrical spark gave me a bad shock');
      setBody('The cord wire popped near the connector plug, sparked loudly, and gave me an electric shock when I touched it. Very poor build quality and hazardous.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) {
      setErrorMessage('Please enter review text content before submitting.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setResultMessage(null);

    const payload = {
      product_id: selectedProductId === 'NEW' ? undefined : selectedProductId,
      product_name: productName || 'Unspecified Monitored Item',
      brand: brand || 'Generic Seller',
      category: category || 'Musical Instruments',
      rating: rating,
      title: title || (rating >= 4 ? 'Positive Product Review' : 'Negative Feedback & Defect Report'),
      body: body,
      reviewer_name: reviewerName || 'Verified Purchaser',
      source: 'WEB 2 Review Portal',
    };

    try {
      const res = await apiFetch('/api/v1/reviews/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to persist review');
      }

      const data = await res.json();
      setResultMessage(data);

      // Reset form text
      setBody('');
      setTitle('');

      // Refresh live feed and stats immediately
      fetchLiveFeed();
      fetchStats();
      fetchProducts();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while saving review directly to DB');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Hero Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-800/30 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-500/30 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Web 2 — Customer Review & Live Database Pipeline
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Customer Product Review Writer
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Write positive or negative product reviews. Every submission is saved directly into the database, evaluated by AI defect surveillance, and updated in real-time across the frontend telemetry.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-800/90 backdrop-blur border border-slate-700 p-4 rounded-2xl">
            <div className="text-center px-2">
              <div className="text-[11px] text-slate-400 font-medium">Database State</div>
              <div className="text-emerald-400 font-bold text-xs flex items-center gap-1.5 justify-center mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                {stats?.db_status || 'PostgreSQL Active'}
              </div>
            </div>
            <div className="h-8 w-px bg-slate-700"></div>
            <div className="text-center px-2">
              <div className="text-[11px] text-slate-400 font-medium">Total Reviews in DB</div>
              <div className="text-white font-extrabold text-xl mt-0.5">
                {stats ? stats.total_reviews.toLocaleString() : '...'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Preset Buttons */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>⚡ One-Click Review Test Presets</span>
              <span className="text-[10px] text-slate-400 font-normal">Pre-fills positive / negative scenarios</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handlePresetSample('positive')}
                className="text-xs font-semibold px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl transition flex items-center gap-1.5"
              >
                <span>🟢</span> Positive Review (5 Stars)
              </button>
              <button
                type="button"
                onClick={() => handlePresetSample('hazard_fire')}
                className="text-xs font-semibold px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl transition flex items-center gap-1.5"
              >
                <span>🔴</span> Fire Hazard Report (1 Star)
              </button>
              <button
                type="button"
                onClick={() => handlePresetSample('defect_shock')}
                className="text-xs font-semibold px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl transition flex items-center gap-1.5"
              >
                <span>🟠</span> Defect & Shock (2 Stars)
              </button>
            </div>
          </div>

          {/* Review Writer Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="text-emerald-600">✍️</span>
                Write Review & Transmit Directly to DB
              </h2>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Direct DB Writer
              </span>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-3">
                <span className="text-lg">⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Result Box */}
            {resultMessage && (
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">✓</span>
                    <span>Saved to Database & Telemetry Recalculated!</span>
                  </div>
                  <span className="text-xs font-mono font-bold bg-emerald-200 text-emerald-900 px-2.5 py-0.5 rounded-md">
                    {resultMessage.realtime_status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs text-slate-800 pt-2 border-t border-emerald-200">
                  <div>
                    <span className="text-slate-500">DB Review ID:</span>{' '}
                    <span className="font-mono font-bold text-slate-900">{resultMessage.review?.external_id || resultMessage.review?.id?.slice(0, 8)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Classified Sentiment:</span>{' '}
                    <span className={`font-bold ${resultMessage.review?.sentiment?.includes('Positive') ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {resultMessage.review?.sentiment}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Product:</span>{' '}
                    <span className="font-bold text-slate-900">{resultMessage.product?.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Updated Risk Score:</span>{' '}
                    <span className="font-bold text-slate-900">{resultMessage.product?.updated_risk_score} / 100</span>
                  </div>
                </div>

                {resultMessage.detected_signals?.length > 0 && (
                  <div className="pt-2">
                    <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider mb-1">
                      ⚠️ AI Safety Signals Flagged & Stored:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {resultMessage.detected_signals.map((sig: any, idx: number) => (
                        <span key={idx} className="bg-rose-100 text-rose-800 text-[11px] font-bold px-2 py-0.5 rounded border border-rose-200">
                          {sig.signal_type} ("{sig.phrase}") — Sev {sig.severity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Product Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Select Monitored Catalog Item
              </label>
              <select
                value={selectedProductId}
                onChange={handleProductSelectChange}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.brand || 'Generic'}) — Category: {p.category || 'Instruments'}
                  </option>
                ))}
                <option value="NEW">➕ Enter Custom / Unlisted Product</option>
              </select>
            </div>

            {/* Custom Product Fields */}
            {selectedProductId === 'NEW' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Product Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Electric Guitar Amp 50W"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg p-2.5 outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. ToneMaster"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg p-2.5 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg p-2.5 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Rating Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Rating & Sentiment Mode
                </label>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                  rating >= 4
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {rating >= 4 ? '🟢 Positive Review' : '🔴 Negative Defect Report'} ({rating}.0 Stars)
                </span>
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`w-10 h-10 rounded-lg font-extrabold text-lg flex items-center justify-center transition ${
                      rating >= star
                        ? star >= 4
                          ? 'bg-amber-400 text-slate-950 shadow-sm'
                          : 'bg-rose-500 text-white shadow-sm'
                        : 'bg-slate-200 text-slate-400 hover:bg-slate-300'
                    }`}
                  >
                    ★
                  </button>
                ))}
                <span className="text-xs font-semibold text-slate-600 ml-2">
                  {rating === 5 && 'Outstanding Performance'}
                  {rating === 4 && 'Good product'}
                  {rating === 3 && 'Average / Mixed'}
                  {rating === 2 && 'Poor / Minor Issue'}
                  {rating === 1 && 'Severe Defect / Hazard'}
                </span>
              </div>
            </div>

            {/* Review Title */}
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Headline / Summary
              </label>
              <input
                type="text"
                placeholder="e.g. Unit got dangerously hot during normal play"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Review Text Body */}
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Review Body Text <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Type customer review details here. Any defect keywords (fire, overheat, shock, burn, noise, breaking) will automatically trigger AI defect signal classification..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
                required
              ></textarea>
            </div>

            {/* Reviewer Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Reviewer Name</label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Source Web Application</label>
                <input
                  type="text"
                  value="WEB 2 Customer Review Portal"
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 text-slate-500 text-sm rounded-xl p-2.5"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-4 px-6 text-white font-extrabold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 ${
                submitting
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] shadow-emerald-700/20'
              }`}
            >
              {submitting ? (
                <>
                  <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Persisting directly to PostgreSQL Database...</span>
                </>
              ) : (
                <>
                  <span>🚀 Send Review Directly to Database</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Live DB Feed Column */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live DB Stats Box */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                <h3 className="text-sm font-bold tracking-tight">Database Ingestion Stats</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                Live Poll (3.5s)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Ingested</div>
                <div className="text-xl font-black text-white mt-1">
                  {stats ? stats.total_reviews.toLocaleString() : '...'}
                </div>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-xl border border-emerald-900/50">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Positive</div>
                <div className="text-xl font-black text-emerald-400 mt-1">
                  {stats ? stats.positive_reviews.toLocaleString() : '...'}
                </div>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-xl border border-rose-900/50">
                <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Defects Flagged</div>
                <div className="text-xl font-black text-rose-400 mt-1">
                  {stats ? stats.total_safety_signals.toLocaleString() : '...'}
                </div>
              </div>
            </div>

            <div className="pt-2 text-xs text-slate-400 flex items-center justify-between">
              <span>Database Sync Status:</span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                ✓ Live & Connected
              </span>
            </div>
          </div>

          {/* Auto-updating Feed */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Real-Time Database Ingestion Feed
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">Auto-refreshes</span>
            </div>

            {loadingFeed ? (
              <div className="space-y-3 py-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : recentReviews.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No reviews saved in database yet. Be the first to submit above!
              </div>
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {recentReviews.map((rev: RecentReviewItem) => (
                  <div
                    key={rev.id}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 rounded-xl transition space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 truncate max-w-[200px]">
                        {rev.product_name}
                      </span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                          rev.rating >= 4
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        ★ {rev.rating}.0 • {rev.sentiment}
                      </span>
                    </div>

                    {rev.title && (
                      <div className="text-xs font-semibold text-slate-800 line-clamp-1">
                        "{rev.title}"
                      </div>
                    )}

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {rev.body}
                    </p>

                    {rev.signals && rev.signals.length > 0 && (
                      <div className="pt-1 flex flex-wrap gap-1">
                        {rev.signals.map((s: { signal_type: string; phrase: string; severity: number }, idx: number) => (
                          <span
                            key={idx}
                            className="bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold px-1.5 py-0.5 rounded"
                          >
                            ⚠️ Defect: {s.signal_type}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/50">
                      <span>Source: {rev.source}</span>
                      <span>{rev.review_date || 'Just now'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
