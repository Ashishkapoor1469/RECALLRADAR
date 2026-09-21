# System Architecture & Technical Documentation
## RecallRadar — Persistent Safety Intelligence Platform

---

## 1. System Overview & Technology Stack

RecallRadar is architected as an end-to-end, multi-tier safety intelligence monorepo separating data ingestion, machine learning risk engines, REST APIs, background task queues, and a modern web presentation dashboard.

```text
[ Data Sources ] ──> [ Ingestion & Normalization ] ──> [ 5-Layer Safety Detector ]
  (Amazon Reviews /          (Python Scripts /              (Lexicon / Regex /
   CPSC / Synthetic)          SQLAlchemy)                   Severity / Vector)
                                                                   │
                                                                   ▼
[ Next.js 14 Dashboard ] <── [ FastAPI REST API ] <─── [ Interpretable Risk Engine ]
  (Risk Queue / Timeline /    (Uvicorn / Pydantic v2)      (0-100 Score / Factors /
   Backtest Lab / RAG)                                       NIM Explanations)
```

### Core Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend UI** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Recharts, Framer Motion, Lucide Icons |
| **Backend API** | Python 3.11+, FastAPI, Uvicorn, Pydantic v2, AsyncIO |
| **Database & ORM** | PostgreSQL 16 with `pgvector` (or local SQLite for dev/offline), SQLAlchemy 2.0 ORM |
| **ML & Analytics** | Sentence-Transformers (384-dim embeddings), Lifelines (Survival Analysis), Custom Lexicon Matcher |
| **LLM & Explanations** | NVIDIA NIM API (`meta/llama-3.1-70b-instruct`) with Local Grounded Fallback Engine |
| **Task Queue** | Celery & Redis 7 (Async background ingestion & batch scoring) |
| **DevOps & Deploy** | Docker, Docker Compose, PowerShell / Bash Startup Scripts, Vercel |

---

## 2. Monorepo Directory & Component Breakdown

```text
RecallRadar/
├── apps/
│   ├── api/                           # FastAPI Backend Service
│   │   ├── app/
│   │   │   ├── api/v1/                # REST Controller Routers
│   │   │   │   ├── alerts.py          # Alert rules & triggers
│   │   │   │   ├── backtests.py       # Backtest lab & budget simulator
│   │   │   │   ├── chat.py            # RAG assistant endpoints
│   │   │   │   ├── overview.py        # Portfolio high-level metrics
│   │   │   │   ├── products.py        # Product catalog & review timeline
│   │   │   │   ├── risk_queue.py      # Prioritized risk queue table
│   │   │   │   ├── system.py          # System diagnostics & health
│   │   │   │   └── trends.py          # Category & risk trend analytics
│   │   │   ├── ml/                    # Machine Learning Engine
│   │   │   │   ├── clustering/        # Defect theme clustering
│   │   │   │   ├── detection/         # 5-Layer Safety Detector & Lexicon
│   │   │   │   ├── risk/              # Interpretable Risk Scoring Engine
│   │   │   │   └── survival/          # Lifelines Survival Analysis
│   │   │   ├── models/                # SQLAlchemy DB Models & Pydantic Schemas
│   │   │   ├── services/              # Ingestion, RAG, and NIM Explanations
│   │   │   └── main.py                # FastAPI Application Entry Point
│   │   └── tests/                     # Pytest Backend Test Suites
│   └── web/                           # Next.js 14 Web Frontend
│       ├── app/                       # App Router Pages & Layouts
│       │   ├── alerts/                # Alert builder page
│       │   ├── ask/                   # Ask RecallRadar RAG Chat page
│       │   ├── backtest/              # Alert Budget Simulator page
│       │   ├── data-quality/          # System diagnostics page
│       │   ├── products/[id]/         # Product detail & timeline replay
│       │   ├── risk_queue/            # Analytical Risk Queue page
│       │   └── page.tsx               # Portfolio Overview Dashboard
│       ├── components/                # Reusable UI Components
│       └── package.json               # Cross-platform dependencies
├── data/                              # Database files & synthetic datasets
├── docs/                              # System SRS, Architecture, API docs
├── scripts/                           # Database seeding & ingestion scripts
│   ├── seed_db.py                     # Synthetic DB seeder
│   ├── ingest_amazon_csv.py           # Amazon Customer Reviews CSV importer
│   └── verify_all.py                  # End-to-end verification runner
├── docker-compose.yml                 # Multi-container orchestration
├── start.ps1                          # Windows PowerShell start script
├── start.sh                           # Linux/macOS Bash start script
└── README.md                          # Repository overview
```

---

## 3. Safety Signal Detection Pipeline & Math

The Safety Detector evaluates review text across **5 distinct layers**:

```text
Review Text ──> [ 1. Lexicon Match ] ──> [ 2. Regex Patterns ] ──> [ 3. Semantic Vector ]
                      │                         │                         │
                      v                         v                         v
               [ 4. Severity Rating (0-4) ] <─────────────────────────────┘
                      │
                      v
               [ 5. Contextual Disambiguation ] ──> Flagged Safety Signal (True/False)
```

### 3.1 Detection Layers
1. **Lexicon Matching**: Scans for exact hazard keywords (`fire`, `smoke`, `melt`, `spark`, `choke`, `shock`, `cut`).
2. **Regex Phrase Matching**: Matches intent phrases (`caught on fire`, `nearly choked`, `sparks flew out`).
3. **Semantic Similarity**: Computes cosine similarity of 384-dim embeddings against known hazard anchor vectors.
4. **Severity Classifier**: Assigns a rating from `0` (non-safety) to `4` (life-threatening hazard).
5. **Contextual Disambiguation**: Eliminates false positives by evaluating negative contexts (e.g. `fast as fire`, `hot price`).

### 3.2 Interpretable Risk Score Formula
The risk score $R \in [0, 100]$ for product $p$ at time $t$ is calculated as:

$$ R(p, t) = \min\left(100, \, w_{\text{vol}} \cdot V_{\text{safety}} + w_{\text{acc}} \cdot A_{\text{velocity}} + w_{\text{sev}} \cdot S_{\text{max}} + w_{\text{ratio}} \cdot R_{\text{complaint}} \right) $$

Where:
- $V_{\text{safety}}$ = Count of flagged safety reviews in recent window (e.g., last 30 days).
- $A_{\text{velocity}}$ = Percentage growth acceleration of safety complaints compared to previous period.
- $S_{\text{max}}$ = Maximum severity score (0–4) scaled to score contribution.
- $R_{\text{complaint}}$ = Ratio of safety complaints to total review volume.

---

## 4. NVIDIA NIM & Local RAG Explanations

### 4.1 NIM Explanation Pipeline
- **API Call**: Invokes NVIDIA NIM Endpoint (`https://integrate.api.nvidia.com/v1`) using `meta/llama-3.1-70b-instruct`.
- **System Prompt**: Enforces strict grounding requiring evidence citation tags `[R-<review_id>]`.
- **Offline Fallback Engine**: If the API key is not configured or network fails, the system executes a local deterministic template generator that compiles review citations without cloud latency.

### 4.2 RAG Architecture (Ask RecallRadar)
- **Vector Index**: 384-dimensional review embeddings indexed in `pgvector`.
- **Query Processing**: User query is vectorized and matched against evidence embeddings using cosine distance ($1 - \text{cosine\_similarity}$).
- **Refusal Guardrail**: If similarity distance exceeds threshold ($> 0.65$), the engine returns a strict refusal message: *"I cannot find sufficient review evidence to answer this query safely."*

---

## 5. Backtest Lab & Alert Budget Simulator

The Backtest Engine runs zero-leakage historical simulations across product timelines:

- **Temporal Isolation**: At week $W$, only review data up to week $W$ is visible to the risk engine.
- **Alert Budget Slider**: Users adjust budget $B \in [1, 100]$ alerts per 1,000 products.
- **Live Metrics Calculated**:
  - **Lead Time**: Average weeks early warning alert fired before official recall.
  - **False Alarm Rate (%)**: Percentage of non-recalled products triggered.
  - **Precision & Recall**: Standard trade-off metrics.

---

## 6. Database Models & Schema Summary

| Table | Primary Key | Key Columns | Description |
|---|---|---|---|
| `products` | `id` (UUID/Text) | `name`, `category`, `brand`, `model_number`, `created_at` | Product catalog metadata |
| `reviews` | `id` (UUID/Text) | `product_id`, `review_date`, `star_rating`, `review_text`, `severity`, `is_safety` | Customer reviews & safety tags |
| `risk_scores` | `id` | `product_id`, `score`, `velocity`, `confidence`, `calculated_at` | Calculated historical risk scores |
| `alerts` | `id` | `product_id`, `title`, `severity`, `status`, `triggered_at`, `rule_id` | System generated safety alerts |
| `alert_rules` | `id` | `name`, `condition_json`, `is_active` | Configurable alert thresholds |

---

## 7. Main API Endpoints Reference

| Endpoint | Method | Description |
|---|---|---|
| `/health` | `GET` | System operational health check |
| `/api/v1/overview/metrics` | `GET` | Portfolio summary metrics (total products, active alerts, avg risk) |
| `/api/v1/risk-queue` | `GET` | Prioritized risk queue table with sorting and filtering |
| `/api/v1/products/{id}` | `GET` | Product details, factor breakdown, and flagged reviews |
| `/api/v1/products/{id}/timeline` | `GET` | Weekly timeline risk evolution for replay mode |
| `/api/v1/backtests/simulate` | `POST` | Simulate alert budget performance (lead time vs budget) |
| `/api/v1/chat` | `POST` | Ask RecallRadar RAG evidence search endpoint |
| `/api/v1/system/diagnostics` | `GET` | Database status, review counts, and error logs |

---

## 8. Deployment & Operations

### Local Execution
```powershell
# Windows
.\start.ps1

# Linux / macOS
chmod +x start.sh
./start.sh
```

### Production Deployment (Docker Compose)
```bash
docker compose up --build -d
```
