# EarlyEcho — Pitch Alignment & Gap Analysis Report

## 1. Intended Product Pitch

> *"Let's take an example close to home — Kreativan Technologies. Imagine you launch a new product/software/device. Customers buy it, use it, and post feedback — reviews, support tickets, app store comments. But nobody at Kreativan is systematically reading all of that. So when a product quietly underperforms or fails, you often don't know why until it's too late — was it a bug, a design flaw, a safety issue, bad UX, wrong market fit? That's exactly the blind spot EarlyEcho solves: instead of guessing after the fact, it continuously reads your own customer feedback, detects the warning signals early, scores the risk, and explains — with evidence — what's actually going wrong and when it started."*

---

## 2. Feature-by-Feature Gap Assessment

### Feature 1: "Continuously reads your own customer feedback"
- **Pitch Claim:** Ingests reviews, support tickets, app store comments continuously for any organization.
- **Current Reality:**
  - Ingestion is executed via offline CLI script (`python scripts/ingest_amazon_csv.py`), targeting Amazon product review CSV structures (specifically `Musical_instruments_reviews.csv`).
  - **No automated continuous polling or webhook listeners** for live customer streams.
  - **No support for support ticket schemas** (e.g. Zendesk, Jira Service Desk) or mobile app store comment APIs (Google Play Developer API / App Store Connect).
- **Status:** **Partially Matches (CLI batch only, hardware/retail schema specific).**

---

### Feature 2: "Detects the warning signals early"
- **Pitch Claim:** Detects emerging warning signals with real measurable lead time before official failure/recall.
- **Current Reality:**
  - Real database computation compares the earliest detected safety signal timestamp with the official recall date (`Recall.recall_date - first_signal.detected_at`).
  - Products with historical recalls accurately report computed lead times (e.g. `7.4 wks early`).
  - Non-recalled products display `"N/A"` rather than hallucinated or hardcoded numbers.
- **Status:** **Matches.**

---

### Feature 3: "Scores the risk"
- **Pitch Claim:** Computes a reliable 0–100 Hazard / Risk Score based on a product's own feedback.
- **Current Reality:**
  - Bayesian hazard engine aggregates verified defect signals and signal severity per product.
  - False positives (such as 5-star reviews mentioning "sound bleeding" or non-complaint contexts) are actively filtered out.
  - Composite risk scores are strictly bound to genuine defect complaint reviews belonging to the specific product.
- **Status:** **Matches.**

---

### Feature 4: "Explains — with evidence — what's actually going wrong and when it started"
- **Pitch Claim:** Cites verbatim customer evidence, identifies defect clusters, and shows the start timeline.
- **Current Reality:**
  - UI displays verified customer review citations with citation IDs (`[REV-...]`), star ratings, matched defect signal tags, and timestamps.
  - Defect cluster tags specify the root issue (e.g., thermal runaway, burn, mechanical fracture).
  - In both Grounded RAG mode and AI Chat mode (NVIDIA NIM), responses reference exact citations and allow tabular SQL exports.
- **Status:** **Matches.**

---

### Feature 5: "Flexible enough to onboard a different company's own data (Kreativan Technologies)"
- **Pitch Claim:** Any company can plug in their own products and feedback types.
- **Current Reality:**
  - Database schema assumes Amazon attributes (`asin`, `overall`, `reviewerID`, `helpful`).
  - The application lacks multi-tenancy, team authentication, organization workspaces, and self-service data upload UI.
  - Defect detection rules are specialized for consumer product safety (burns, electric shock, fires, lacerations) rather than software bugs, API regressions, or SaaS UX issues.
- **Status:** **Missing Entirely (Single-dataset prototype architecture).**

---

## 3. Executive Gap Summary

| Area | Status | Key Missing Capabilities |
| :--- | :--- | :--- |
| **Interpretable Risk Scoring** | ✅ Matches | Fully operational 0–100 Bayesian hazard scoring. |
| **Grounded Evidence Explanations** | ✅ Matches | Review quotations, ratings, timestamps, and RAG/NIM citations. |
| **Early Warning Lead Windows** | ✅ Matches | Statistically computed lead times on historical ground truth. |
| **Continuous Streaming Ingestion** | ⚠️ Partial | Batch Python CLI ingestion only; no continuous webhook or scheduled crawler. |
| **Bring-Your-Own-Data (BYOD) Ingestion** | ❌ Missing | No UI or generic API for uploading custom CSVs, Zendesk tickets, or App Store reviews. |
| **Multi-Tenancy & Workspaces** | ❌ Missing | Global shared catalog; no organization-level data isolation. |
| **Software / Digital Defect Taxonomy** | ❌ Missing | Rules are hardware/safety focused; needs software error/UX taxonomy for tech firms. |
