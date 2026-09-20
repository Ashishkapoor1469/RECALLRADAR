# RecallRadar — Persistent Safety Intelligence & Early Recall Warning

> **"Know a product is unsafe before the recall."**

RecallRadar monitors customer reviews and public safety reports, detects emerging safety-defect signals, calculates product risk over time, triggers configurable alerts, explains alerts using grounded evidence, and backtests historical products to measure how early the system would have caught a problem before an official recall.

---

## Key Features

- **Risk Queue**: Semrush-style analytical table prioritizing products by calculated risk score (0-100), velocity growth, confidence level, and historical lead time.
- **Product Detail & Timeline Replay**: Week-by-week interactive replay controller stepping through review progression to watch risk evolve and observe early warning alert firing.
- **Multi-Layer Safety Signal Detector**: 5-layer hybrid detector combining lexicon matching, regex phrase patterns, vector embeddings, severity classification (0-4), and contextual disambiguation.
- **Interpretable Risk Engine**: Transparent 0-100 risk scoring with additive factor contributor breakdowns (e.g. `+31 Increasing burn reports`).
- **NVIDIA NIM Grounded Explanations**: Grounded LLM explanations enforcing evidence citation IDs (`[R-101]`) with local deterministic fallback engine for offline execution.
- **Ask RecallRadar (RAG)**: Conversational search over `pgvector` database with strict citation grounding and hallucination refusal guardrails.
- **Backtest Lab & Alert Budget Simulator**: Interactive Alert Budget slider (1-100 alerts/1k products) calculating live lead times, false alarm rates, and precision/recall tradeoff curves.
- **Offline Synthetic Dataset**: Pre-packaged synthetic generator with planted defect scenarios (Demo Smart Charger overheating, Plush Toy choking hazard, Baby High Chair fall hazard, Tower Heater cord sparks) for offline demonstrations.

---

## Quick Start

```bash
# 1. Clone & copy environment settings
cp .env.example .env

# 2. Build and start services
docker compose up --build -d

# 3. Seed synthetic dataset
make seed

# Access Dashboard: http://localhost:3000
# Access API Docs:  http://localhost:8000/docs
```

---

## Running Verification Tests

```bash
python scripts/run_all_tests.py
```

---

## Repository Monorepo Structure

```text
recallradar/
├── apps/
│   ├── web/            # Next.js 14 App Router, TypeScript, Tailwind CSS
│   └── api/            # Python FastAPI, SQLAlchemy 2.0, Pydantic v2
├── data/
│   └── synthetic/      # Planted defect scenario generator
├── docker/
├── docs/               # System architecture, data model, ML & API docs
├── scripts/            # Seed & test runner scripts
├── docker-compose.yml
├── Makefile
├── TODO.md             # Master authoritative task checklist
└── README.md
```
