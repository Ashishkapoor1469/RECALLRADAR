# RecallRadar — Persistent Safety Intelligence & Early Recall Warning

> **"Know a product is unsafe before the recall."**

RecallRadar monitors customer reviews and public safety reports, detects emerging safety-defect signals, calculates product risk over time, triggers configurable alerts, explains alerts using grounded evidence, and backtests historical products to measure how early the system would have caught a problem before an official recall.

---

## Key Features

- **Risk Queue**: Semrush-style analytical table prioritizing products by calculated risk score (0–100), velocity growth, confidence level, and historical lead time.
- **Product Detail & Timeline Replay**: Week-by-week interactive replay controller stepping through review progression to watch risk evolve and observe early warning alert firing.
- **Multi-Layer Safety Signal Detector**: Hybrid detector combining lexicon keyword matching, severity classification (0–4), regex phrase patterns, and contextual disambiguation.
- **Interpretable Risk Engine**: Transparent 0–100 risk scoring with additive factor contributor breakdowns (e.g., `+31 Increasing burn reports`).
- **NVIDIA NIM Grounded Explanations**: Grounded LLM explanations enforcing evidence citation IDs (`[R-101]`) with local deterministic fallback engine for offline execution.
- **Ask RecallRadar (RAG)**: Conversational assistant over review and safety data with strict citation grounding and hallucination refusal guardrails.
- **Backtest Lab & Alert Budget Simulator**: Interactive Alert Budget slider (1–100 alerts/1k products) calculating live lead times, false alarm rates, and precision/recall tradeoff curves.
- **Data Quality & Diagnostics**: Real-time system status, database health metrics, review volume tracking, and error diagnostics.
- **Amazon CSV Ingestion & Synthetic Data**: Native CLI tools for ingesting real-world Amazon Customer Reviews dataset (`scripts/ingest_amazon_csv.py`) alongside synthetic test cases.

---

## Documentation & Specifications

- **[Software Requirements Specification (SRS)](file:///c:/Users/hp/Desktop/RecallRadar/docs/SRS.md)**: Formal functional and non-functional requirements specification matrix.
- **[System Architecture & Technical Docs](file:///c:/Users/hp/Desktop/RecallRadar/docs/ARCHITECTURE_AND_DOCS.md)**: Detailed monorepo architecture, 5-layer safety detection math, NVIDIA NIM integration, and RAG pipeline documentation.

---

## Technical Architecture

```
RecallRadar Monorepo
├── apps/
│   ├── web/            # Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons, Framer Motion
│   └── api/            # Python FastAPI, SQLAlchemy 2.0, Pydantic v2, SQLite / PostgreSQL
├── data/               # Local database & Amazon customer reviews datasets
├── docs/               # System architecture & API documentation
├── scripts/            # Database seeding, CSV ingestion, verification runners
├── docker-compose.yml  # Multi-container orchestration (FastAPI, Next.js, Postgres, Redis)
├── start.ps1 / .sh     # One-click startup scripts
└── README.md
```

---

## Quick Start

### Option 1: One-Click Local Startup (Windows / Linux / macOS)

**Windows (PowerShell):**
```powershell
.\start.ps1
```

**Linux / macOS:**
```bash
chmod +x start.sh
./start.sh
```

### Option 2: Docker Compose Setup

```bash
# 1. Copy environment configuration
cp .env.example .env

# 2. Build and launch services
docker compose up --build -d

# 3. Seed database
python scripts/seed_db.py
```

- **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Backend API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Data Ingestion & Scripts

- **Seed Offline Database**:
  ```bash
  python scripts/seed_db.py
  ```
- **Ingest Amazon Reviews CSV**:
  ```bash
  python scripts/ingest_amazon_csv.py path/to/dataset.csv
  ```
- **Run Full System Verification**:
  ```bash
  python scripts/verify_all.py
  ```

---

## Deployment (Vercel & Cloud)

- **Frontend (`apps/web`)**: Configured for Vercel deployment with cross-platform Next.js SWC build settings.
- **Backend (`apps/api`)**: Ready for containerized deployment on AWS / GCP / Azure or Render / Railway via Uvicorn & Docker.

---

## License

MIT License. See [LICENSE](LICENSE) for details.
