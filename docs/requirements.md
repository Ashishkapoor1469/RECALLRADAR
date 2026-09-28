# EarlyEcho System Requirements Specification

This document details the functional and non-functional requirements implemented in the EarlyEcho (RecallRadar) safety intelligence platform.

---

## 1. Functional Requirements (FR)

| ID | Requirement | Description | Status & Implementation Evidence |
| :--- | :--- | :--- | :--- |
| **FR-1** | **Multi-Source Feedback Ingestion** | Ingest raw customer feedback from multiple disparate sources (Amazon Customer Reviews CSV, CPSC Regulatory Recalls, and Customer Support Tickets), normalize into a unified schema, and deduplicate records. | 🟢 **Implemented & Verified**<br>• `SupportTicketsAdapter` & `AmazonReviewsAdapter` in `apps/api/app/services/ingestion/adapters.py`<br>• CLI runner: `scripts/ingest_support_tickets_csv.py`<br>• Verified in `apps/api/tests/test_adapters.py` |
| **FR-2** | **Multi-Layer Defect Signal Detection** | Detect safety defect mentions (burn, shock, fire, overheat, cut) using regex patterns, keyword lexicons, and contextual disambiguation to filter non-safety false alarms. | 🟢 **Implemented & Verified**<br>• Multi-layer detector in `apps/api/app/services/detection/detector.py`<br>• Verified in `test_safety_detector.py` and `test_false_alarms.py` |
| **FR-3** | **14-Day Defect Spike Detection** | Compare defect mention frequency in recent sliding windows against historical baseline frequency to identify emerging defect clusters. | 🟢 **Implemented & Verified**<br>• `evaluate_defect_spike()` in `apps/api/app/alerts/engine.py`<br>• Noise filter: $\ge 3$ mentions guard, multiplier $k \ge 2.0\times$<br>• Verified in `apps/api/tests/test_spike_detection.py` |
| **FR-4** | **Bayesian Product Risk Scoring** | Compute an interpretable Hazard Score (0–100) using Bayesian probability, review signal velocity, and severity weighting without temporal leakage. | 🟢 **Implemented & Verified**<br>• Scoring logic in `apps/api/app/api/v1/reviews.py` & `models.py`<br>• Top 10 product scores preserved identically |
| **FR-5** | **RAG Copilot with Grounded Citations** | Generate root-cause safety explanations using NVIDIA NIM LLM grounded in retrieved reviews, enforcing review ID citations (`[R-101]`) and refusing hallucinations. | 🟢 **Implemented & Verified**<br>• Grounded RAG in `apps/api/app/api/v1/ask.py` and `apps/api/app/services/llm/rag.py`<br>• Verified in `test_grounding.py` |
| **FR-6** | **Multi-Channel Alert Dispatch** | Automatically dispatch incident notifications on threshold breach or defect spike via Resend transactional email and Slack incoming webhooks. | 🟢 **Implemented & Verified**<br>• Dispatcher in `apps/api/app/alerts/resend_dispatcher.py`<br>• Slack-compatible JSON payload, 5s timeout<br>• Verified in `apps/api/tests/test_webhook_alert.py` |
| **FR-7** | **Zero-Flicker Live Synchronization** | Automatically reflect new database records across the frontend dashboard within ~4 seconds without full page reload or loss of scroll/filter state. | 🟢 **Implemented & Verified**<br>• Lightweight change token endpoint: `GET /api/v1/system/changes`<br>• Shared hook: `useLiveData` in `apps/web/lib/useLiveData.tsx`<br>• Applied to Overview, Risk Queue, Alerts, Data Quality, Product Detail, and Sidebar Badge |
| **FR-8** | **Direct Database Customer Portal** | Provide an external customer portal (Web 2) allowing direct review submission and hazard preset injection with immediate database confirmation. | 🟢 **Implemented & Verified**<br>• Customer portal in `apps/web2/app/page.tsx`<br>• Presets for Fire, Shock, and Praise defect induction |

---

## 2. Non-Functional Requirements (NFR)

| ID | Requirement | Target Standard | Status & Implementation Evidence |
| :--- | :--- | :--- | :--- |
| **NFR-1** | **Sub-50ms Endpoint Latency** | Change token and status endpoints must return within 50 ms under ordinary load. | 🟢 **Met**<br>• In-memory cache (2.0s TTL) in `apps/api/app/api/v1/system.py` serves cached hits in **< 1 ms**.<br>• Verified in `test_system_changes_cache_performance`. |
| **NFR-2** | **Fail-Soft Network Isolation** | Outbound third-party network calls (Resend email, Slack webhooks, NVIDIA NIM) must not hang or crash API transactions if third-party services fail. | 🟢 **Met**<br>• Strict 5.0-second timeout on all outbound requests with try/except isolation.<br>• Verified in `apps/api/tests/test_webhook_alert.py`. |
| **NFR-3** | **Zero Temporal Leakage** | Historical simulations and backtests must strictly mask reviews published after the simulation date. | 🟢 **Met**<br>• Time-boundary filtering in `apps/api/app/api/v1/backtests.py`.<br>• Verified in `apps/api/tests/test_temporal_leakage.py`. |
| **NFR-4** | **Resource & Bandwidth Efficiency** | Frontend polling must not overwhelm the client CPU or flood server bandwidth with redundant requests. | 🟢 **Met**<br>• Single polling loop per browser tab.<br>• Response payload size: **230 bytes**.<br>• Volume: **13.3 requests / min** (~3.0 KB/min).<br>• Automatically pauses when tab is hidden via Page Visibility API. |
| **NFR-5** | **Exponential Reconnection Backoff** | Polling must back off smoothly during server outages and avoid spamming failing endpoints. | 🟢 **Met**<br>• Exponential backoff (4.5s $\to$ 8s $\to$ 14.5s $\to$ 26s $\to$ 30s max).<br>• Displays `Reconnecting…` status in header. |
| **NFR-6** | **Enterprise Security & Audit Trail** | Sensitive actions (rule creation, alert dispatch, data export) must be immutably recorded with zero committed secrets. | 🟢 **Met**<br>• `AuditLog` model in `apps/api/app/models/models.py`.<br>• `log_audit()` wired into rule creation, alert dispatch, and CSV export.<br>• Zero secrets in repository; environment-driven configuration. |
| **NFR-7** | **Zero-Flicker UX Preservation** | Background refreshes must maintain current DOM elements, active search filters, pagination, and user input focus. | 🟢 **Met**<br>• `isBackground` flag in `useLiveData` suppresses skeleton/loading states during sync.<br>• Preserves input fields, active page, and drawer inspection states. |

---

## 3. Verification & Compliance Summary

- **Automated Test Suite**: 26 / 26 backend tests passing cleanly (`python scripts/run_all_tests.py`).
- **Production Next.js Build**: 0 type errors, 0 lint errors, 9/9 routes compiled cleanly (`npm --prefix apps/web run build`).
- **Data Integrity**: 100% score consistency preserved for all top 10 products before and after updates.
