# EarlyEcho (RecallRadar) — System Product & Architecture Document (PD)

**Product Tagline:** Know a product is unsafe before the recall — AI-powered defect surveillance, real-time database review ingestion, and risk intelligence.

---

## 1. System Overview & Monorepo Architecture

EarlyEcho is a product safety intelligence platform designed to continuously analyze customer feedback, monitor defect signals, score hazard exposure, and provide early warning lead times before official product recalls occur.

The project is structured as a modular monorepo:

```text
                               ┌─────────────────────────────────────────┐
                               │       CUSTOMER & OPERATIONS INPUTS      │
                               │                                         │
                               │  • Amazon Customer Reviews              │
                               │  • SaferProducts Safety Reports         │
                               │  • Direct DB Web 2 Review Portal        │
                               └────────────────────┬────────────────────┘
                                                    │
                                                    ▼
                               ┌─────────────────────────────────────────┐
                               │           FASTAPI BACKEND ENGINE        │
                               │                                         │
                               │  • POST /api/v1/reviews/submit          │
                               │  • AI / Lexicon Defect Signal Detector  │
                               │  • Dynamic Risk Engine (0 - 100 Score)  │
                               │  • RAG Vector Retrieval                 │
                               └────────────────────┬────────────────────┘
                                                    │
                                                    ▼
                               ┌─────────────────────────────────────────┐
                               │        CENTRAL PERSISTENCE DB STORE     │
                               │                                         │
                               │  • PostgreSQL 16 + pgvector             │
                               │  • SQLite Operational Fallback          │
                               │  • Products, Reviews, Signals, Recalls  │
                               └──────────┬────────────────────┬─────────┘
                                          │                    │
                                          ▼                    ▼
                   ┌──────────────────────────────┐    ┌──────────────────────────────┐
                   │    WEB 1: EARLYECHO DASHBOARD │    │    WEB 2: REVIEW WRITER WEB   │
                   │         (apps/web)           │    │         (apps/web2)          │
                   │                              │    │                              │
                   │ • Executive Overview (`/`)   │    │ • Interactive Review Writer  │
                   │ • Risk Queue Directory       │    │ • Positive / Negative Modes  │
                   │ • Product Investigation      │    │ • One-Click Test Presets     │
                   │ • Alerts & Backtest Lab      │    │ • Direct DB Ingestion Box    │
                   │ • Ask EarlyEcho RAG AI       │    │ • Real-time Live DB Feed     │
                   └──────────────────────────────┘    └──────────────────────────────┘
```

---

## 2. Monorepo Applications Summary

| Application | Location | Tech Stack | Purpose |
| :--- | :--- | :--- | :--- |
| **Backend API** | `apps/api` | FastAPI, SQLAlchemy, PostgreSQL/pgvector, Python 3.11 | High-performance RESTful API powering risk scoring, review submission, vector embeddings, signal extraction, and system status telemetry. |
| **Main Dashboard (Web 1)** | `apps/web` | Next.js 14, React 18, Tailwind CSS, Framer Motion, Recharts | Executive & Operational Safety Dashboard featuring real-time risk queue, product detail deep dives, backtest lab, alerts, and RAG copilot. |
| **Customer Review Portal (Web 2)** | `apps/web2` | Next.js 14, React 18, Tailwind CSS, Direct API Client | Dedicated customer feedback submission web app. Users can write positive or negative product reviews that save directly to DB and trigger real-time UI updates. |

---

## 3. Real-Time Review Pipeline (`Web 2` → `Database` → `Web 1 & 2`)

### Step-by-Step Flow:

1. **Review Creation (`apps/web2`):**
   - User selects an indexed product or enters a new product name and brand.
   - User sets star rating (1–5 Stars) and writes review headline & body text.
   - **One-Click Presets** allow immediate testing of Positive (5★), Fire Hazard (1★), or Defect & Shock (2★) scenarios.

2. **Direct DB Submission (`POST /api/v1/reviews/submit`):**
   - Payload is transmitted directly to the FastAPI backend.
   - If the product does not exist, it is created instantly in the `products` table.
   - A `Review` record is created with a unique UUID, timestamp, and external ID (`REV-XXXX`).

3. **AI Defect & Sentiment Signal Extraction:**
   - The multi-layer detection engine (`SafetySignalDetector`) scans the review body for positive sentiment vs hazard keywords (`fire`, `burn`, `overheat`, `electric shock`, `smoke`, `noise`, `injury`).
   - For every verified defect keyword, `SafetySignal` and `ReviewSignal` records are saved in the DB.

4. **Dynamic Risk Score Recalculation:**
   - Composite risk score (0–100) is updated in real-time based on signal density, defect severity, and negative review count.
   - A new `ProductRiskSnapshot` is saved to record the updated risk trajectory.

5. **Real-Time Telemetry Sync:**
   - **Web 2** displays direct confirmation with DB Record ID, assigned sentiment, detected safety signals, and updated risk score.
   - Both **Web 1** and **Web 2** auto-refresh their live feeds and telemetry counters in real-time without requiring a browser reload.

---

## 4. Key Screens & Capabilities

### 1. Executive Overview Dashboard (`apps/web/app/page.tsx`)
- **Live Status Beacon:** Displays current active database (`PostgreSQL` / `SQLite`) and rescan controls.
- **KPI Summary Cards:** Total Products Monitored, Reviews Ingested, High Risk Flags count, and Highest Risk Model card deep-link.
- **Sentiment & Signal Telemetry Chart:** Recharts gradient area chart comparing positive sentiment vs negative defect signals.
- **Products Needing Attention:** Ranked list of fleet products requiring urgent QA intervention.

### 2. Standalone Customer Review Portal (`apps/web2/app/page.tsx`)
- **Interactive Review Writer:** Clean form for submitting positive and negative product feedback.
- **Quick Test Presets:** 🟢 Positive Review (5★), 🔴 Fire Hazard (1★), 🟠 Defect & Shock (2★).
- **Direct DB Confirmation Box:** Instant feedback with DB ID, risk score impact, and detected defect keywords.
- **Real-Time Database Feed:** Live scrolling ticker auto-polling every 3.5 seconds to display newly ingested DB reviews.

### 3. Risk Queue (`apps/web/app/risk-queue/page.tsx`)
- Paginated table ranking all catalog products by transparent composite hazard score (0–100).
- Live search bar and status filters (High Risk, Moderate, Clean).

### 4. Product Investigation (`apps/web/app/products/[id]/page.tsx`)
- Risk score timeline graph showing historical hazard accumulation over time.
- Verbatim customer evidence quotes with star ratings and highlighted defect phrases.
- Early warning lead time calculation comparing first detected signal date vs official CPSC recall date.

### 5. Backtest Lab & Alerts (`apps/web/app/backtest/page.tsx`)
- Simulates detection lead-time performance against historical product safety incidents.
- Configurable alert budget and threshold sensitivity testing.

### 6. Ask EarlyEcho RAG AI (`apps/web/app/ask/page.tsx`)
- Conversational safety assistant powered by vector retrieval and grounded customer evidence citations.

---

## 5. Simple & Clear Explanations for Anyone

- **What does writing a review do?**  
  When you write a review in **Web 2**, it doesn't just sit on your screen — it goes straight into our database (`PostgreSQL` or `SQLite`).

- **How does positive vs. negative review detection work?**  
  If you give 4 or 5 stars, it's categorized as a **Positive Review** and boosts the product's satisfaction score. If you give 1 to 3 stars, or mention hazard words like *"caught fire"*, *"overheated"*, or *"gave me a shock"*, our system flags it as a **Negative Defect Signal** and recalculates the product's danger score.

- **How is real-time update achieved?**  
  The moment your review hits the database, the backend recalculates the product risk score and updates the review counters. The frontend web pages poll for updates every few seconds, displaying your newly submitted review on the live ticker instantly!

- **How are CORS and Frontend URLs handled?**  
  The backend API is configured with dynamic CORS rules (`allow_origins=["*"]`), so whether you open the app on `localhost`, `earlyecho.vercel.app`, or any custom domain, all review submissions and telemetry fetches succeed smoothly without any errors.
