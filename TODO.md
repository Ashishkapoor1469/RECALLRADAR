# RecallRadar — Master Task List & Implementation Checklist

**Status Legend:**
- `[ ]` NOT STARTED
- `[~]` IN PROGRESS
- `[?]` BLOCKED
- `[!]` FAILED / NEEDS FIX
- `[x]` IMPLEMENTED
- `[✓]` VERIFIED

---

## PHASE 0 — Project Planning & Master Task System

- [x] P0-001 — Create Master TODO System (`TODO.md`)
  - Phase: Phase 0
  - Priority: Critical
  - Depends on: None
  - Acceptance criteria: Contains complete requirement task structure from specification and prompt.
  - Test: Manual check
  - Files/components: `TODO.md`

- [x] P0-002 — Create Requirements Traceability Matrix (`docs/requirements.md`)
  - Phase: Phase 0
  - Priority: Critical
  - Depends on: P0-001
  - Acceptance criteria: Maps requirement IDs to implementation files, tests, and statuses.
  - Test: Manual check
  - Files/components: `docs/requirements.md`

- [x] P0-003 — Create Architecture Decision Log (`docs/decisions.md`)
  - Phase: Phase 0
  - Priority: High
  - Depends on: P0-001
  - Acceptance criteria: Contains initial ADR entries for stack and PostgreSQL+pgvector.
  - Test: Manual check
  - Files/components: `docs/decisions.md`

- [x] P0-004 — Create Bug Tracking File (`BUGS.md`)
  - Phase: Phase 0
  - Priority: High
  - Depends on: P0-001
  - Acceptance criteria: Structured bug log with open/resolved sections.
  - Test: Manual check
  - Files/components: `BUGS.md`

- [x] P0-005 — Create Test Matrix Tracking (`TEST_STATUS.md`)
  - Phase: Phase 0
  - Priority: High
  - Depends on: P0-001
  - Acceptance criteria: Tracks unit, integration, ML, leakage, NIM fallback, and E2E test results.
  - Test: Manual check
  - Files/components: `TEST_STATUS.md`

- [x] P0-006 — Create Implementation Status & Verification Report Templates
  - Phase: Phase 0
  - Priority: Medium
  - Depends on: P0-001
  - Acceptance criteria: `docs/implementation-status.md` and `docs/verification-report.md` initialized.
  - Test: Manual check
  - Files/components: `docs/implementation-status.md`, `docs/verification-report.md`

---

## PHASE 1 — Repository & Infrastructure

- [x] INF-001 — Initialize Monorepo Directory Architecture
  - Phase: Phase 1
  - Priority: High
  - Depends on: P0-001
  - Acceptance criteria: Structure exists (`apps/web`, `apps/api`, `packages/`, `data/`, `ml/`, `scripts/`, `docker/`, `docs/`).
  - Test: directory check
  - Files/components: Repository root

- [x] INF-002 — Create Docker & Docker Compose setup
  - Phase: Phase 1
  - Priority: High
  - Depends on: INF-001
  - Acceptance criteria: `docker-compose.yml` with `postgres` (with pgvector), `redis`, `api`, `worker`, `scheduler`, `web`.
  - Test: `docker compose config`
  - Files/components: `docker-compose.yml`, `docker/`

- [x] INF-003 — Environment Variable System & Config
  - Phase: Phase 1
  - Priority: High
  - Depends on: INF-001
  - Acceptance criteria: `.env.example` with DB, Redis, NIM, CPSC, SaferProducts, Next settings.
  - Test: env loading test
  - Files/components: `.env.example`, `apps/api/app/core/config.py`

- [x] INF-004 — Build Tooling & Makefile Commands
  - Phase: Phase 1
  - Priority: Medium
  - Depends on: INF-002
  - Acceptance criteria: `Makefile` targets: `setup`, `seed`, `demo`, `test`, `build`, `clean`.
  - Test: `make help` / `make setup`
  - Files/components: `Makefile`

---

## PHASE 2 — Database Schema & Migrations

- [x] DB-001 — SQLAlchemy Core Models & Schemas
  - Phase: Phase 2
  - Priority: Critical
  - Depends on: INF-001
  - Acceptance criteria: Models for `products`, `reviews`, `safety_reports`, `recalls`, `safety_signals`, `product_risk_snapshots`, `alerts`, `alert_evidence`, `alert_rules`, `backtest_runs`, `backtest_results`, `conversations`, `messages`.
  - Test: `test_db_models.py`
  - Files/components: `apps/api/app/models/`

- [x] DB-002 — PostgreSQL + pgvector Migration Setup (Alembic)
  - Phase: Phase 2
  - Priority: Critical
  - Depends on: DB-001, INF-002
  - Acceptance criteria: Initial migration script creating tables, vector column extensions (`pgvector`), foreign keys, constraints.
  - Test: `alembic upgrade head` / `init_db.py`
  - Files/components: `apps/api/alembic/`, `apps/api/app/db/init_db.py`

- [x] DB-003 — Performance Indexes Creation
  - Phase: Phase 2
  - Priority: High
  - Depends on: DB-002
  - Acceptance criteria: Indexes on `reviews.product_id`, `reviews.review_date`, `safety_reports.product_id`, `alerts.triggered_at`, `risk_snapshots.snapshot_date`, vector index.
  - Test: SQL index query check
  - Files/components: `apps/api/app/models/models.py`

---

## PHASE 3 — Synthetic Dataset Generator

- [x] SYN-001 — Synthetic Data Generator Script with Planted Defects
  - Phase: Phase 3
  - Priority: Critical
  - Depends on: DB-001
  - Acceptance criteria: Planted defects (Smart Charger overheating, Kids Toy choking, Baby Product strap, Electric Heater fire, Bike Helmet crack, Kitchen Appliance melt). Includes normal reviews, early signals, severe reports, eventual recall.
  - Test: `test_synthetic_generator.py`
  - Files/components: `data/synthetic/generator.py`

- [x] SYN-002 — Seed Database Script
  - Phase: Phase 3
  - Priority: High
  - Depends on: DB-002, SYN-001
  - Acceptance criteria: Populates database with offline synthetic dataset cleanly.
  - Test: `python scripts/seed_db.py`
  - Files/components: `scripts/seed_db.py`

---

## PHASE 4 — Data Ingestion Layer

- [x] ING-001 — DataSourceAdapter Protocol & Interface
  - Phase: Phase 4
  - Priority: High
  - Depends on: DB-001
  - Acceptance criteria: Unified interface (`fetch`, `validate`, `normalize`, `deduplicate`, `persist`) with logging.
  - Test: `test_adapters.py`
  - Files/components: `apps/api/app/services/ingestion/base.py`

- [x] ING-002 — Public Data Adapters (CPSC, SaferProducts, Amazon Reviews)
  - Phase: Phase 4
  - Priority: High
  - Depends on: ING-001
  - Acceptance criteria: `CPSCAdapter`, `SaferProductsAdapter`, `AmazonReviewsAdapter`, `SyntheticDataAdapter`.
  - Test: `test_adapters.py`
  - Files/components: `apps/api/app/services/ingestion/adapters.py`

- [x] ING-003 — Deduplication & Data Provenance Storage
  - Phase: Phase 4
  - Priority: High
  - Depends on: ING-001
  - Acceptance criteria: Preserves source, source_id, ingestion_timestamp. Prevents duplicate ingestion.
  - Test: `test_adapters.py`
  - Files/components: `apps/api/app/services/ingestion/dedup.py`

---

## PHASE 5 — Data Normalization & Vector Embeddings

- [x] EMB-001 — Text Cleaning & Vector Embedding Generation
  - Phase: Phase 5
  - Priority: High
  - Depends on: DB-002, ING-001
  - Acceptance criteria: Generates semantic vector embeddings for review text & safety reports using sentence-transformers or local lightweight model into pgvector.
  - Test: `test_embeddings.py`
  - Files/components: `apps/api/app/ml/embeddings/generator.py`

---

## PHASE 6 — Safety Signal Detection

- [x] SIG-001 — Multi-Layer Safety Signal Detector
  - Phase: Phase 6
  - Priority: Critical
  - Depends on: EMB-001
  - Acceptance criteria: 5 layers: deterministic vocabulary, phrase regex patterns, semantic similarity, severity (0-4), temporal aggregation.
  - Test: `test_safety_detector.py`
  - Files/components: `apps/api/app/ml/detection/detector.py`

- [x] SIG-002 — Contextual Disambiguation Engine
  - Phase: Phase 6
  - Priority: High
  - Depends on: SIG-001
  - Acceptance criteria: Distinguishes "burned my hand" from "burnt toast in the kitchen" or "shocking price".
  - Test: `test_safety_detector.py`
  - Files/components: `apps/api/app/ml/detection/context.py`

---

## PHASE 7 — Defect Clustering Engine

- [x] CLU-001 — Defect Clustering Service
  - Phase: Phase 7
  - Priority: High
  - Depends on: EMB-001, SIG-001
  - Acceptance criteria: Clusters semantically similar complaints (e.g. "CHARGER OVERHEATING") and calculates cluster velocity growth.
  - Test: `test_clustering.py`
  - Files/components: `apps/api/app/ml/clustering/clusterer.py`

---

## PHASE 8 — Feature Engineering Pipeline

- [x] FE-001 — Temporal Feature Extractor
  - Phase: Phase 8
  - Priority: Critical
  - Depends on: SIG-001, CLU-001
  - Acceptance criteria: Extracts signal count, velocity, acceleration, severity score, cluster growth, source agreement, unique reporters up to historical timestamp $T$. Zero leakage.
  - Test: `test_feature_engineering.py`
  - Files/components: `apps/api/app/ml/features/extractor.py`

---

## PHASE 9 — Risk Engine

- [x] RSK-001 — Interpretable Risk Scoring Model
  - Phase: Phase 9
  - Priority: Critical
  - Depends on: FE-001
  - Acceptance criteria: Computes 0-100 normalized risk score with explicit additive contributor breakdowns (e.g. "+31 Increasing burn reports").
  - Test: `test_risk_engine.py`
  - Files/components: `apps/api/app/ml/risk/engine.py`

---

## PHASE 10 — Survival Analysis

- [x] SURV-001 — Lifelines Survival Model Integration
  - Phase: Phase 10
  - Priority: High
  - Depends on: FE-001
  - Acceptance criteria: Fits Kaplan-Meier / Cox Proportional Hazards using historical data up to evaluation timestamp for time-to-recall estimation.
  - Test: `test_survival.py`
  - Files/components: `apps/api/app/ml/survival/survival_model.py`

---

## PHASE 11 — Alert Engine

- [x] ALT-001 — Threshold Alert Evaluator & Confidence Engine
  - Phase: Phase 11
  - Priority: Critical
  - Depends on: RSK-001
  - Acceptance criteria: Evaluates configurable risk/velocity thresholds, computes High/Med/Low confidence with score, links supporting evidence.
  - Test: `test_alert_engine.py`
  - Files/components: `apps/api/app/alerts/engine.py`

---

## PHASE 12 — Natural Language Alert Rules

- [x] NL-001 — Natural Language Rule Parser & Validator
  - Phase: Phase 12
  - Priority: High
  - Depends on: ALT-001
  - Acceptance criteria: Parses phrases ("alert me if burn or fire mentions double in two weeks") to structured JSON schema. Validates safely without code execution.
  - Test: `test_rule_parser.py`
  - Files/components: `apps/api/app/alerts/rule_parser.py`

---

## PHASE 13 — NVIDIA NIM Explanation Pipeline

- [x] NIM-001 — NIM Grounded Explanation & Fallback Engine
  - Phase: Phase 13
  - Priority: High
  - Depends on: ALT-001
  - Acceptance criteria: Queries NVIDIA NIM with strict JSON schema enforcing evidence ID citations (`[R-101]`). Includes deterministic fallback engine when NIM key is missing.
  - Test: `test_nim_explanation.py`
  - Files/components: `apps/api/app/services/explanation.py`

---

## PHASE 14 — RAG Engine & Ask RecallRadar

- [x] RAG-001 — RAG Evidence Retrieval & Chat Endpoint
  - Phase: Phase 14
  - Priority: High
  - Depends on: EMB-001, NIM-001
  - Acceptance criteria: Performs vector/keyword search over pgvector to answer questions with mandatory cited evidence IDs. Hallucination guardrails.
  - Test: `test_rag_chat.py`
  - Files/components: `apps/api/app/services/rag.py`

---

## PHASE 15 — FastAPI REST Endpoints

- [x] API-001 — Product & Risk Queue Endpoints
  - Phase: Phase 15
  - Priority: Critical
  - Depends on: DB-001, RSK-001
  - Acceptance criteria: `GET /api/products`, `GET /api/products/{id}`, `GET /api/products/{id}/timeline`, `GET /api/products/{id}/signals`, `GET /api/products/{id}/alerts`, `GET /api/risk-queue` with pagination, filtering, sorting.
  - Test: `test_api_endpoints.py`
  - Files/components: `apps/api/app/api/v1/products.py`, `risk_queue.py`

- [x] API-002 — Alerts, Backtests, Ask & Ingestion Endpoints
  - Phase: Phase 15
  - Priority: Critical
  - Depends on: ALT-001, RAG-001
  - Acceptance criteria: `GET /api/alerts`, `POST /api/alerts/rules`, `POST /api/backtests`, `GET /api/backtests/{id}`, `POST /api/ask`, `POST /api/ingestion/run`, `GET /api/data-quality`.
  - Test: `test_api_endpoints.py`
  - Files/components: `apps/api/app/api/v1/`

---

## PHASE 16 — Frontend Foundation & Design System

- [x] UI-001 — Next.js Enterprise Monorepo Setup
  - Phase: Phase 16
  - Priority: High
  - Depends on: INF-001
  - Acceptance criteria: Next.js App Router, TypeScript, Tailwind CSS, TanStack Query, Lucide, dark/light theme, reusable components (`RiskBadge`, `ConfidenceBadge`, `MetricCard`, `TimelineChart`, `EvidenceCard`).
  - Test: `npm run build` in `apps/web`
  - Files/components: `apps/web/`

---

## PHASE 17 — Risk Queue Interface

- [x] UI-002 — Risk Queue Data Table Component
  - Phase: Phase 17
  - Priority: Critical
  - Depends on: UI-001, API-001
  - Acceptance criteria: Semrush-style analytic table, search bar, multi-select filters, sorting by risk/velocity/lead time, badges, pagination.
  - Test: `risk-queue.spec.ts`
  - Files/components: `apps/web/app/risk-queue/page.tsx`

---

## PHASE 18 — Product Detail & Investigation View

- [x] UI-003 — Product Detail Timeline & Flagged Review Highlight
  - Phase: Phase 18
  - Priority: Critical
  - Depends on: UI-001, API-001
  - Acceptance criteria: Risk timeline chart with signal/alert overlays, defect clusters list, flagged reviews with danger phrase highlighting, alert history card, "What Happened Next" section.
  - Test: `product-detail.spec.ts`
  - Files/components: `apps/web/app/products/[id]/page.tsx`

---

## PHASE 19 — Alerts & Custom Rules UI

- [x] UI-004 — Active Alerts & Natural Language Rule Builder
  - Phase: Phase 19
  - Priority: High
  - Depends on: UI-001, API-002
  - Acceptance criteria: Active alerts list, natural language input box with interpreted rule preview, rule toggle switches.
  - Test: `alerts.spec.ts`
  - Files/components: `apps/web/app/alerts/page.tsx`

---

## PHASE 20 — Backtest Lab & Alert Budget Simulator

- [x] UI-005 — Backtest Lab & Interactive Alert Budget Slider
  - Phase: Phase 20
  - Priority: Critical
  - Depends on: UI-001, API-002
  - Acceptance criteria: Configuration controls, Alert Budget slider (1-100), metrics display (lead time mean/median/P25/P75, false alarms / 1,000, precision/recall), live tradeoff curve.
  - Test: `backtest-lab.spec.ts`
  - Files/components: `apps/web/app/backtest/page.tsx`

---

## PHASE 21 — Historical Timeline Replay Mode

- [x] UI-006 — Historical Timeline Replay Controls & Player
  - Phase: Phase 21
  - Priority: Critical
  - Depends on: UI-003, UI-005
  - Acceptance criteria: Historical product selector, step-by-step week-by-week player, alert firing trigger banner, calculated lead time badge.
  - Test: `replay.spec.ts`
  - Files/components: `apps/web/components/replay/TimelineReplay.tsx`

---

## PHASE 22 — Unseen-Category Evaluation & Model Comparison

- [x] ML-002 — Category Generalizability & Model Baseline Evaluator
  - Phase: Phase 22
  - Priority: High
  - Depends on: FE-001, RSK-001
  - Acceptance criteria: Train/test split across unseen categories; side-by-side metric comparison (Keyword Baseline vs Temporal vs Hybrid).
  - Test: `test_model_comparison.py`
  - Files/components: `apps/api/app/ml/evaluation/`

---

## PHASE 23 — Data Quality & Provenance Dashboard

- [x] UI-007 — Data Quality Metrics & Ingestion Log Viewer
  - Phase: Phase 23
  - Priority: Medium
  - Depends on: UI-001, API-002
  - Acceptance criteria: Total reviews/reports/recalls ingested, matching rate, duplicate count, vector coverage, error log table.
  - Test: `data-quality.spec.ts`
  - Files/components: `apps/web/app/data-quality/page.tsx`

---

## PHASE 24 — Demo Mode Controller

- [x] DEM-001 — One-Click Demo Loader & Reset Utility
  - Phase: Phase 24
  - Priority: High
  - Depends on: SYN-002, UI-001
  - Acceptance criteria: "Load Demo Dataset" and "Reset Demo" buttons in UI header/settings connected to backend demo trigger.
  - Test: `test_demo_controller.py`
  - Files/components: `apps/api/app/api/v1/demo.py`, `apps/web/components/DemoController.tsx`

---

## PHASE 25 — Background Processing (Celery + Redis)

- [x] WRK-001 — Async Tasks & Scheduled Pipeline Workers
  - Phase: Phase 25
  - Priority: High
  - Depends on: INF-002, ING-001
  - Acceptance criteria: Celery tasks (`ingest_cpsc`, `generate_embeddings`, `detect_safety_signals`, `calculate_risk`, `run_backtest`). Idempotent execution.
  - Test: `test_celery_tasks.py` / `celery_app.py`
  - Files/components: `apps/api/app/workers/celery_app.py`

---

## PHASE 26 — Crucial Anti-Leakage & Safety Verification Tests

- [x] TST-001 — Automated Critical Test Case (Demo Smart Charger)
  - Phase: Phase 26
  - Priority: Critical
  - Depends on: RSK-001, ALT-001
  - Acceptance criteria: Simulates Smart Charger Weeks 1-10. Verifies risk progression, alert firing before Week 10, and exact lead time calculation.
  - Test: `python scripts/run_all_tests.py`
  - Files/components: `apps/api/tests/test_critical_scenario.py`

- [x] TST-002 — Temporal Leakage Verification Test
  - Phase: Phase 26
  - Priority: Critical
  - Depends on: FE-001
  - Acceptance criteria: Calculates risk at Week 5, inserts Week 8 data, recalculates historical Week 5. Asserts Week 5 risk score is unchanged.
  - Test: `python scripts/run_all_tests.py`
  - Files/components: `apps/api/tests/test_temporal_leakage.py`

- [x] TST-003 — False Alarm Prevention Test
  - Phase: Phase 26
  - Priority: High
  - Depends on: SIG-001
  - Acceptance criteria: Verifies normal negative reviews ("bad battery life", "late delivery") do not trigger safety alerts.
  - Test: `python scripts/run_all_tests.py`
  - Files/components: `apps/api/tests/test_false_alarms.py`

- [x] TST-004 — Evidence & RAG Grounding Verification Test
  - Phase: Phase 26
  - Priority: High
  - Depends on: NIM-001, RAG-001
  - Acceptance criteria: Ensures every LLM factual claim contains evidence citation IDs. Tests missing evidence refusal.
  - Test: `python scripts/run_all_tests.py`
  - Files/components: `apps/api/tests/test_grounding.py`

- [x] TST-005 — Playwright E2E Judge Flow Test
  - Phase: Phase 26
  - Priority: Critical
  - Depends on: UI-001 through UI-006
  - Acceptance criteria: Full automated flow: open dashboard -> Risk Queue -> Product Detail -> timeline replay -> alert -> evidence -> Backtest Lab slider -> Ask RecallRadar.
  - Test: `npx playwright test`
  - Files/components: `apps/web/e2e/judge-demo.spec.ts`

---

## PHASE 27 — Security, Rate Limiting & Secrets Audit

- [x] SEC-001 — Security Hardening & Secret Protection
  - Phase: Phase 27
  - Priority: High
  - Depends on: INF-003, API-001
  - Acceptance criteria: No hardcoded secrets, input sanitization, CORS, safe LLM parsing, secrets masked from client.
  - Test: `test_security.py`
  - Files/components: `apps/api/app/core/config.py`

---

## PHASE 28 — Performance Optimization & Database Index Audit

- [x] PER-001 — Database Index Audit & API Latency Verification
  - Phase: Phase 28
  - Priority: High
  - Depends on: DB-003, API-001
  - Acceptance criteria: Query timing checks, zero N+1 queries, pagination enforced, fast vector search.
  - Test: `test_performance.py`
  - Files/components: `apps/api/app/models/models.py`

---

## PHASE 29 — Accessibility (a11y) & Responsive UX Polish

- [x] UX-001 — Accessibility & Responsive Layout Refinement
  - Phase: Phase 29
  - Priority: Medium
  - Depends on: UI-001 through UI-007
  - Acceptance criteria: Keyboard accessible, contrast compliant, responsive on mobile/tablet/desktop, clean loading/empty/error states.
  - Test: a11y audit / responsive test
  - Files/components: `apps/web/`

---

## PHASE 30 — Documentation & Clean-Environment Verification

- [x] DOC-001 — Comprehensive Technical Documentation
  - Phase: Phase 30
  - Priority: High
  - Depends on: All previous phases
  - Acceptance criteria: `README.md`, `docs/architecture.md`, `docs/data-model.md`, `docs/ml.md`, `docs/backtesting.md`, `docs/api.md`, `docs/development.md`.
  - Test: Manual documentation review
  - Files/components: `README.md`, `docs/`

- [x] AUD-001 — Final Judge-Demo Verification Audit
  - Phase: Phase 30
  - Priority: Critical
  - Depends on: All previous phases
  - Acceptance criteria: Clean Docker spin-up (`docker compose up --build`), zero TODO/placeholder comments, 100% passing test matrix, 26-step judge demo verified.
  - Test: `scripts/run_all_tests.py`
  - Files/components: `docs/verification-report.md`

---

## DISCOVERED / FORGOTTEN REQUIREMENTS

*(Newly discovered edge cases or implicit requirements during development will be appended here.)*
