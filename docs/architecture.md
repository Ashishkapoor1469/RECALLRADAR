# EarlyEcho System Architecture & Technical Specifications

> **"Know a product is unsafe before the recall."**  
> Continuous defect intelligence, Bayesian risk surveillance, pgvector RAG citations, and sub-50ms live synchronization.

---

## 1. System Architecture Diagram

![EarlyEcho System Architecture](earlyecho-architecture.svg)

*An editable Draw.io XML source is maintained in [earlyecho-architecture.drawio](earlyecho-architecture.drawio).*

---

## 2. Core Architectural Components

### 2.1 Client Frontend Layer (`apps/web` & `apps/web2`)
Built on **Next.js 14 (App Router)**, **React 18**, **Tailwind CSS**, and **Framer Motion**:
- **Safety Analyst Dashboard (`apps/web`)**:
  - **Executive Overview (`/`)**: Real-time KPI metrics, sentiment trends, urgent attention items, and product directory.
  - **Live Risk Queue (`/risk-queue`)**: Priority-ranked table by Bayesian harm probability, velocity spikes, and signal cluster counts. Preserves filters, pagination, and inspection states during live background refreshes.
  - **Investigation Workspace (`/products/[id]`)**: Deep-dive forensics with hazard score breakdown, early lead-time warning window, CPSC recall cross-references, and deduplicated review citations.
  - **Directives & Alert Engine (`/alerts`)**: Severity threshold rules, natural language directive evaluation, and multi-channel dispatch status.
  - **Data Feed Quality (`/data-quality`)**: Live database connectivity probes, pgvector embedding coverage, and queue health diagnostics.
- **Customer Review Portal (`apps/web2`)**:
  - Direct database review submission interface with one-click hazard injection presets (Fire, Shock, Praise) and real-time live ticker (~3.5s refresh).
- **Single-Loop Live Synchronization (`useLiveData`)**:
  - Single polling loop per browser tab querying `/api/v1/system/changes` every 4.5 seconds.
  - **Zero Flicker**: Background updates keep existing DOM elements intact and silently swap updated values.
  - **Page Visibility API**: Automatically pauses polling when the browser tab is idle or hidden.
  - **Exponential Backoff**: Dynamically extends retry delays up to 30 seconds on server disconnection, displaying `Reconnecting…` in the header.

### 2.2 API Gateway & Reverse Proxy
- **Edge Routing**: Reverse proxy mapping incoming requests to `/api/v1/*` endpoints with SSL/TLS termination on Render and Vercel.
- **CORS & Headers**: Managed cross-origin resource sharing supporting local developer ports and remote cloud deployments.
- **Fail-Soft Boundary**: All client endpoints resolve cleanly with isolated error boundaries.

### 2.3 Core Surveillance Engine (`apps/api`)
Built on **Python 3.11**, **FastAPI**, and **SQLAlchemy 2.0**:
- **Lightweight Change Token (`GET /api/v1/system/changes`)**:
  - Generates composite MD5 hashes and timestamp tokens for reviews, products, alerts, and signals.
  - In-memory cache (2.0s TTL) guarantees sub-millisecond response times without database connection overhead on cache hits.
  - Fail-safe status: Returns HTTP 503 if database connectivity fails (never a fake 200).
- **Multi-Source Ingestion Pipeline**:
  - **Amazon Marketplace Reviews**: Normalized review text, star ratings, and timestamps.
  - **CPSC / SaferProducts.gov**: Official federal regulatory recall filings and incident reports.
  - **Customer Support Tickets**: Ingestion adapter normalizing ticket descriptions and severity into unified safety signals.
  - **Deduplication Engine**: Content hashing prevents duplicate entries across ingestion batches.

### 2.4 ML & Bayesian Risk Engine
- **Multi-Layer Safety Signal Detector**:
  - Combines domain lexicon keyword matching, regular expression phrase patterns, and severity classification (levels 0 to 4: burn, fire, smoke, overheat, shock, cut).
  - Contextual disambiguation filters false alarms (e.g. musical "burn in headphones" vs electrical "burnt wire").
- **Bayesian Defect Severity Scorer**:
  - Produces an interpretable 0–100 Hazard Score using Bayesian probability, review signal velocity, and severity weighting.
  - **Zero Temporal Leakage**: Enforces strict chronological cutoff preventing future data leakage into historical evaluation.
- **14-Day Defect Spike Detection**:
  - Monitors defect mention frequency in recent sliding windows against baseline frequency, firing alerts when mentions surge by $\ge 2.0\times$ with a minimum volume guard.

### 2.5 RAG Grounded Copilot (NVIDIA NIM)
- **Vector Embeddings**: 384-dimensional dense vectors generated using `all-MiniLM-L6-v2` stored in PostgreSQL with `pgvector` IVFFlat cosine similarity indexing.
- **Grounded Citation Enforcement**:
  - NVIDIA NIM LLM generates root-cause explanations grounded exclusively in retrieved database evidence.
  - Enforces mandatory review ID citations (`[R-101]`, `[R-102]`).
  - Strict hallucination refusal: Refuses to hypothesize or validate claims without supporting database records.

### 2.6 Caching & Persistence Layer
- **PostgreSQL (Supabase Cloud)**: Relational tables (`products`, `reviews`, `safety_signals`, `product_risk_snapshots`, `alerts`, `alert_rules`, `audit_log`) with ACID compliance.
- **Upstash Redis**:
  - 5-minute TTL query cache for expensive aggregate calculations on the executive overview.
  - Message broker for asynchronous Celery worker background tasks.

### 2.7 Alert Notification Dispatchers
- **Transactional Email**: Resend API integration dispatching formatted safety alerts to engineering and compliance leads.
- **Incoming Webhooks / Slack**: Fail-soft webhook dispatcher posting structured alert payloads with 5-second timeout isolation.

---

## 3. Technology Stack Reference

| Tier | Technologies | Purpose |
| :--- | :--- | :--- |
| **Frontend Dashboard** | Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion, Recharts | Executive safety interface and real-time risk queue |
| **Customer Portal** | Next.js 14, Tailwind CSS | Direct review submission and defect induction testing |
| **Backend API** | Python 3.11, FastAPI, Uvicorn, Pydantic v2 | High-performance REST surveillance engine |
| **ORM & Database** | SQLAlchemy 2.0, PostgreSQL, Supabase Cloud | Persistent relational store and transaction management |
| **Vector Search** | pgvector (384-dim embeddings), IVFFlat Indexing | High-speed semantic similarity retrieval |
| **AI / RAG** | NVIDIA NIM, SentenceTransformers (`all-MiniLM-L6-v2`) | Grounded root-cause analysis with evidence citations |
| **Cache & Broker** | Upstash Redis, Celery | Sub-50ms query caching and asynchronous tasks |
| **Alert Dispatch** | Resend API, Slack Webhooks | Multi-channel automated incident notifications |
| **Deployment** | Vercel (Frontend), Render (Backend) | Production cloud hosting with automated continuous deployment |
