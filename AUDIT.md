# RecallRadar Audit Log — Legacy & Hardcoded Telemetry Audit

This document tracks all synthetic/legacy occurrences, hardcoded values, static fallback arrays, and inconsistent endpoints identified across the codebase, along with the precise fixes applied.

---

| ID | Component / File | Audit Finding / Problem Description | Remediation Applied |
| :--- | :--- | :--- | :--- |
| **AUD-01** | `SidebarNav.tsx` | User profile card ("Dr. Aris Vance / Chief Safety Officer") and fake telemetry claims ("14.8k revs/day"). | Removed user profile UI. Added live **Data Source Card** powered by `/api/v1/system/status` displaying dataset name, database engine badge, total reviews, and total products. |
| **AUD-02** | `page.tsx` (Overview) | Hardcoded static KPI values ("91.8%", "7.4 wks early", "4.5 false alarms"), static chart bars, and fake product fallbacks. | Connected all KPIs, cards, and charts to `/api/v1/overview/summary` and `/api/v1/overview/sentiment-performance` with real SQL aggregations. |
| **AUD-03** | `backtest/page.tsx` | Synthetic backtest cases ("Demo Smart Charger 65W", "ThermoGlow Space Heater v2", "Plush Bear Toy") rendered when no labeled recalls existed. | Unified backtest KPIs under `/api/v1/backtests/summary` and `/api/v1/backtests/simulate`. Renders honest empty state ("Not enough data yet") when no labeled recall notices exist. |
| **AUD-04** | `risk_queue.py` & `products.py` | Discrepancy between Risk Queue card score and Product Detail page score. | Unified continuous risk score calculations across `/api/v1/risk-queue/`, `/api/v1/products/attention`, and `/api/v1/products/{id}`. |
| **AUD-05** | `ask/page.tsx` & `chat.py` | Chat interface lacked interactive SQL table exports and cited synthetic IDs. | Connected to `/api/v1/chat/` with NVIDIA NIM SQL tool function calling, interactive sortable SQL tables, real review citations, and one-click CSV table export. |
| **AUD-06** | `seed_db.py` & `ingest_amazon_csv.py` | Seeding wiped out `Musical_instruments_reviews.csv` with synthetic products ("Demo Smart Charger", "Plush Bear", etc.). | Populated 906 real products, 10,334 reviews, 57 safety signals, and 1,950 pre-classified review signals into PostgreSQL/SQLite. |
| **AUD-07** | `page.tsx` (Overview List) | Product list lacked pagination controls and server-side limit/offset handling. | Implemented server-side pagination (10 items/page, Next/Prev controls, `?page=` URL state). |
| **AUD-08** | `page.tsx` (Sentiment Panel) | Missing interactive Positive / Negative sentiment performance toggle. | Created animated Framer-Motion sentiment panel connected to `/api/v1/overview/sentiment-performance` showing real customer sentiment vs. defect themes. |
| **AUD-09** | `products/[id]/page.tsx` | Product detail page had hardcoded numeric fallback defaults `82.0` and `7.4`. | Removed hardcoded numeric fallback defaults; values now render strictly from database API or clean empty states. |
| **AUD-10** | `risk-queue/page.tsx` | Unpaginated card layout; missing category/min-risk filters and server pagination. | Implemented server-side pagination (10 items/page), min-risk filter, category selector, and sort ordering. |
| **AUD-11** | Next.js App Router | `useSearchParams()` caused static pre-render bails without Suspense boundaries. | Wrapped page components in React `<Suspense>` boundaries and declared `export const dynamic = 'force-dynamic'`. |
| **AUD-12** | `verify_all.py` | Verification suite lacked automated checking for new system status and sentiment endpoints. | Built comprehensive verification script (`python scripts/verify_all.py`) validating all 10 API endpoints and cross-endpoint count consistency. |
