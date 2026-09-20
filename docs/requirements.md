# RecallRadar — Requirements Traceability Matrix

This document maps all high-level prompt requirements to their implementation components, corresponding test suites, and current verification statuses.

| Requirement ID | Specification Requirement | Primary Implementation File(s) | Test Suite File(s) | Verification Status |
|---|---|---|---|---|
| RR-001 | Risk Queue analytical table | `apps/web/app/risk-queue/page.tsx` | `apps/web/e2e/judge-demo.spec.ts` | [✓] VERIFIED |
| RR-002 | Product Detail & Timeline investigation | `apps/web/app/products/[id]/page.tsx` | `apps/web/e2e/judge-demo.spec.ts` | [✓] VERIFIED |
| RR-003 | Flagged Reviews & Danger Phrase Highlight | `apps/web/app/products/[id]/page.tsx` | `apps/web/e2e/judge-demo.spec.ts` | [✓] VERIFIED |
| RR-004 | Historical Timeline Replay mode | `apps/web/app/products/[id]/page.tsx` | `apps/web/e2e/judge-demo.spec.ts` | [✓] VERIFIED |
| RR-005 | Alert Budget Simulator & Tradeoff Curve | `apps/web/app/backtest/page.tsx` | `apps/api/tests/test_backtest.py` | [✓] VERIFIED |
| RR-006 | Natural Language Alert Rule Builder | `apps/api/app/alerts/rule_parser.py` | `apps/api/tests/test_rule_parser.py` | [✓] VERIFIED |
| RR-007 | Ask RecallRadar RAG Chat | `apps/api/app/services/rag.py` | `apps/api/tests/test_rag_chat.py` | [✓] VERIFIED |
| RR-008 | Multi-Layer Safety Signal Detector | `apps/api/app/ml/detection/` | `apps/api/tests/test_safety_detector.py` | [✓] VERIFIED |
| RR-009 | Contextual Safety Disambiguation | `apps/api/app/ml/detection/context.py` | `apps/api/tests/test_safety_language.py` | [✓] VERIFIED |
| RR-010 | Defect Clustering Engine | `apps/api/app/ml/clustering/` | `apps/api/tests/test_clustering.py` | [✓] VERIFIED |
| RR-011 | Interpretable Risk Engine (0-100) | `apps/api/app/ml/risk/` | `apps/api/tests/test_risk_engine.py` | [✓] VERIFIED |
| RR-012 | Lifelines Survival Analysis Integration | `apps/api/app/ml/survival/` | `apps/api/tests/test_survival.py` | [✓] VERIFIED |
| RR-013 | NVIDIA NIM Grounded Explanations | `apps/api/app/services/explanation.py` | `apps/api/tests/test_nim_explanation.py` | [✓] VERIFIED |
| RR-014 | Deterministic Offline Explanation Fallback | `apps/api/app/services/explanation.py` | `apps/api/tests/test_nim_explanation.py` | [✓] VERIFIED |
| RR-015 | Offline Synthetic Dataset Generator | `data/synthetic/generator.py` | `apps/api/tests/test_synthetic_generator.py` | [✓] VERIFIED |
| RR-016 | CPSC & SaferProducts Data Adapters | `apps/api/app/services/ingestion/adapters.py` | `apps/api/tests/test_adapters.py` | [✓] VERIFIED |
| RR-017 | Unseen Category Generalizability Test | `apps/web/app/backtest/page.tsx` | `apps/api/tests/test_model_comparison.py` | [✓] VERIFIED |
| RR-018 | Zero Temporal Leakage Architecture | `apps/api/app/ml/features/` | `apps/api/tests/test_temporal_leakage.py` | [✓] VERIFIED |
| RR-019 | Non-Safety False Alarm Filtering | `apps/api/app/ml/detection/` | `apps/api/tests/test_false_alarms.py` | [✓] VERIFIED |
| RR-020 | Automated Critical Scenario Verification | `data/synthetic/` | `apps/api/tests/test_critical_scenario.py` | [✓] VERIFIED |
| RR-021 | Database Schema & pgvector Migrations | `apps/api/app/models/` | `apps/api/tests/test_db_models.py` | [✓] VERIFIED |
| RR-022 | Docker Compose Architecture | `docker-compose.yml` | Manual docker compose up | [✓] VERIFIED |
| RR-023 | Celery Async Ingestion & Worker Tasks | `apps/api/app/workers/` | `apps/api/tests/test_celery_tasks.py` | [✓] VERIFIED |
| RR-024 | Data Quality & Provenance Dashboard | `apps/web/app/data-quality/page.tsx` | `apps/web/e2e/judge-demo.spec.ts` | [✓] VERIFIED |
| RR-025 | Model Versioning & Reproducibility | `apps/api/app/models/` | `apps/api/tests/test_backtest.py` | [✓] VERIFIED |
