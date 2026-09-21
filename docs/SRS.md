# Software Requirements Specification (SRS)
## RecallRadar — Persistent Safety Intelligence & Early Recall Warning System

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) document defines the functional, non-functional, interface, and architectural requirements for **RecallRadar**. RecallRadar is an early warning product safety intelligence platform designed to detect emerging safety-defect signals from customer reviews and public safety reports, calculate product risk scores over time, issue interpretable alerts, provide grounded LLM explanations, and backtest historical lead times prior to official regulatory recalls.

### 1.2 Scope
RecallRadar covers:
- Ingestion and normalization of multi-source data (Amazon Customer Reviews, CPSC, SaferProducts, synthetic datasets).
- Multi-layer NLP and ML safety signal detection (lexicon matching, regex patterns, vector embeddings, severity rating 0–4, contextual disambiguation).
- Interpretable Risk Scoring Engine (0–100 scale) with additive factor breakdowns.
- Grounded explanation generation via NVIDIA NIM API and deterministic offline fallback.
- RAG (Retrieval-Augmented Generation) chat assistant over vectorized review evidence with citation enforcement (`[R-101]`).
- Interactive dashboard UI featuring a Risk Queue, Timeline Replay Controller, Backtest Lab (Alert Budget Simulator), and System Diagnostics.
- Zero-leakage historical backtesting system to simulate early warning performance against real regulatory recalls.

### 1.3 Definitions & Acronyms
- **CPSC**: Consumer Product Safety Commission.
- **NIM**: NVIDIA Inference Microservice.
- **RAG**: Retrieval-Augmented Generation.
- **SRS**: Software Requirements Specification.
- **Lead Time**: Time duration (in weeks or days) between early alert firing and official recall date.
- **Severity Rating**: Safety issue impact rating from 0 (non-safety complaint) to 4 (critical life/fire hazard).

---

## 2. Overall Description

### 2.1 Product Perspective
RecallRadar operates as a monorepo platform comprising:
1. **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS, Lucide icons, Framer Motion.
2. **Backend**: Python FastAPI REST server, Pydantic v2, SQLAlchemy 2.0 ORM.
3. **Database**: PostgreSQL with `pgvector` extension (or local SQLite for zero-dependency execution).
4. **Processing**: Hybrid ML risk engine, async background tasks, synthetic data generators.

### 2.2 Product Functions
- **Risk Queue**: Priority matrix ranking products by risk score, velocity growth, confidence level, and predicted lead time.
- **Product Detail & Timeline Replay**: Interactive week-by-week timeline controller stepping through review volume and risk score progression.
- **Safety Signal Detection**: 5-layer pipeline detecting hazards (burns, sparks, choking, structural collapse) while filtering non-safety complaints (e.g., shipping delays, cosmetic blemishes).
- **Interpretable Risk Scoring**: Transparent score computation (0–100) with explicit mathematical factors (`+31 Increasing burn reports`, `+18 Critical severity rating`).
- **NVIDIA NIM & Local Grounded Explanations**: Automated evidence-backed summary reports referencing specific review IDs.
- **RAG Chat Assistant**: Natural language query engine over database evidence with hallucination refusal.
- **Backtest Lab & Alert Budget Simulator**: Tradeoff analysis tool modeling precision, recall, and lead time vs. alert budget (1–100 alerts / 1k products).
- **Data Quality Diagnostics**: Provenance tracking, database health status, review count metrics, and system diagnostic logs.

### 2.3 User Classes & Characteristics
1. **Safety Analysts & Quality Managers**: Analyze emerging risks, inspect review evidence, configure alert rules, and export risk reports.
2. **Product Managers & Executives**: Monitor portfolio health, view risk queues, and simulate alert budgets for operational planning.
3. **System Administrators & Data Engineers**: Manage data ingestion pipelines, check data quality diagnostics, and deploy services.

### 2.4 Operating Environment
- **Operating Systems**: Windows 10/11, Linux (Ubuntu 20.04+), macOS.
- **Node.js Environment**: Node.js 18.x or 20.x, npm 9.x+.
- **Python Environment**: Python 3.10 / 3.11 / 3.12.
- **Containerization**: Docker & Docker Compose v2+.

---

## 3. System Features & Functional Requirements

### 3.1 Feature 1: Risk Queue & Analytical Dashboard
- **FR-1.1**: The system shall render a paginated, sortable analytical queue of products prioritized by calculated Risk Score (0–100).
- **FR-1.2**: Each product row shall display Product Name, Category, Risk Score, Risk Level (Critical, High, Medium, Low), Velocity Growth Rate (%), Confidence Level, and Lead Time.
- **FR-1.3**: The system shall support filtering products by Category, Risk Level, and Search Query.

### 3.2 Feature 2: Product Detail & Historical Replay
- **FR-2.1**: The system shall provide a detailed product page displaying key metrics, risk factor breakdowns, flagged safety reviews, and danger phrase highlights.
- **FR-2.2**: The system shall feature a Timeline Replay controller allowing users to step week-by-week from Week 1 to current time, recalculating risk score dynamically without temporal leakage.
- **FR-2.3**: Flagged reviews shall explicitly display Review ID, Date, Star Rating, Severity Score, and Highlighted Danger Phrases.

### 3.3 Feature 3: Multi-Layer Safety Signal Detector
- **FR-3.1**: **Layer 1 (Lexicon Matching)**: Detect safety keywords (fire, smoke, spark, choke, explode, snap, shock).
- **FR-3.2**: **Layer 2 (Regex Phrase Patterns)**: Match phrase patterns (e.g. `caught on fire`, `nearly choked`, `sharp edge cut`).
- **FR-3.3**: **Layer 3 (Vector Similarity)**: Compute 384-dimensional embeddings to match semantic risk vectors.
- **FR-3.4**: **Layer 4 (Severity Classifier)**: Assign severity level 0–4 to each review.
- **FR-3.5**: **Layer 5 (Contextual Disambiguation)**: Filter non-safety usage (e.g. `fire customer service`, `hot deal`, `smokin fast shipping`).

### 3.4 Feature 4: Interpretable Risk Engine
- **FR-4.1**: Compute a normalized risk score on a 0–100 scale using the formula:
  $$ \text{Risk Score} = \min\left(100, \sum w_i \cdot f_i\right) $$
  where $f_i$ are factor metrics (recent safety complaint volume, velocity acceleration, maximum severity, cumulative complaint ratio).
- **FR-4.2**: Generate additive factor breakdowns explaining score components.

### 3.5 Feature 5: NVIDIA NIM & Grounded Explanations
- **FR-5.1**: Integrate NVIDIA NIM API (`meta/llama-3.1-70b-instruct` or equivalent) to generate structured evidence summaries.
- **FR-5.2**: Enforce mandatory citation tags (e.g., `[R-101]`) for every claim.
- **FR-5.3**: Provide a deterministic offline fallback engine when `NVIDIA_NIM_API_KEY` is absent or unreachable.

### 3.6 Feature 6: Ask RecallRadar (RAG Chat)
- **FR-6.1**: Provide a natural language search interface querying review database evidence via similarity search.
- **FR-6.2**: Refuse to answer queries outside product safety evidence scope or without grounded citations.

### 3.7 Feature 7: Backtest Lab & Alert Budget Simulator
- **FR-7.1**: Run temporal backtests across historical product timelines without future data leakage.
- **FR-7.2**: Provide an interactive Alert Budget slider (1–100 alerts / 1k products).
- **FR-7.3**: Live-recalculate average lead time (weeks before recall), false alarm rate (%), precision, and recall.

---

## 4. Non-Functional Requirements

### 4.1 Performance Requirements
- **NFR-1.1 (Response Time)**: API endpoints `/api/v1/products` and `/api/v1/risk-queue` shall respond within < 200 ms for standard page sizes.
- **NFR-1.2 (Build Optimization)**: Next.js frontend pages shall maintain First Load JS size < 100 kB for core routes.

### 4.2 Security & Compliance
- **NFR-2.1 (Environment Isolation)**: API keys and database connection strings shall be stored in `.env` configuration files and excluded from git repositories.
- **NFR-2.2 (Cross-Platform Compatibility)**: Build dependencies shall support Linux and Windows without OS-locked binary failures (`EBADPLATFORM`).

### 4.3 Reliability & Availability
- **NFR-3.1 (Offline Fallback)**: The system shall remain 100% operational in offline environments without external cloud API dependencies.
- **NFR-3.2 (Graceful Degradation)**: Database queries shall fallback gracefully to SQLite when PostgreSQL/Redis is unavailable.

---

## 5. Interface Requirements

### 5.1 User Interfaces
- Modern responsive web layout using dark slate design tokens, glassmorphism containers, dynamic metric charts (Recharts), and interactive timeline sliders.

### 5.2 Application Programming Interfaces (APIs)
- RESTful HTTP JSON endpoints conforming to OpenAPI 3.0 standards hosted at `/docs`.
