# EarlyEcho — UI Functionality Reference

This document serves as the ground-truth technical specification for every screen and UI component in the EarlyEcho application. All data sources, UI interactions, fallback states, and discrepancies between UI labels and backend implementations are verified directly against the codebase.

---

## 1. Overview Page (`/`)

**Purpose:**  
Provides an executive and operational bird's-eye view of product fleet health, emerging defect signals, review ingestion volumes, and critical risk items. Used primarily by Safety Operations Directors, Compliance Officers, and Quality Assurance Leads to assess organizational exposure and initiate investigations.

---

### Component: Demo Controls & Telemetry Header Bar
- **Displays:**
  - Status badge: `"PostgreSQL Active (Supabase)"` or `"SQLite Operational (Local Fallback)"` with a pulsing live status beacon indicator.
  - Action button: `"Rescan Telemetry"`.
- **Data Source:**
  - Database status from `GET /api/v1/system/status` (checks `SELECT 1` execution against database engine and dialect).
  - Rescan action triggers `POST /api/v1/system/rescan` with fallback timeout handling.
- **Interactions:**
  - Clicking **"Rescan Telemetry"**: Displays an animated spinning icon and `"Rescanning..."` status, invalidates cached overview summaries, and refreshes metrics upon completion.
- **States:**
  - **Loading:** Database badge displays `"Connecting..."`; button is disabled during active rescan.
  - **With Data:** Displays active database dialect and interactive rescan button.
  - **Error:** Displays `"Database Offline (Degraded Mode)"` with a red indicator if the database connection fails.

---

### Component: KPI Summary Metric Cards (4 Cards)
- **Displays:**
  1. **Products Monitored:** Total number of distinct active models/products in the catalog.
  2. **Reviews Ingested:** Total normalized customer reviews processed into the intelligence store.
  3. **High-Risk Flags:** Number of products currently exceeding the elevated hazard threshold (risk score >= 50).
  4. **Highest Risk Model:** ASIN / product title and score of the most critical item currently flagged in the fleet.
- **Data Source:**
  - `GET /api/v1/overview/summary`
  - SQL:
    ```sql
    SELECT count(*) FROM products;
    SELECT count(*) FROM reviews;
    SELECT count(*) FROM products WHERE current_risk >= 50;
    SELECT id, name, current_risk FROM products ORDER BY current_risk DESC LIMIT 1;
    ```
- **Interactions:**
  - Clicking on the **Highest Risk Model** card deep-links the user directly to the Product Detail investigation page (`/products/{id}`).
- **States:**
  - **Loading:** Displays pulsing skeleton bars (`animate-pulse`) across all 4 cards.
  - **With Data:** Displays exact numerical metrics and contextual trend badges (e.g. `"+12% vs prior month"`).
  - **Empty:** Displays `0` for counts and `"N/A"` for the highest-risk item if no products are seeded.

---

### Component: Sentiment Performance & Signal Telemetry Chart
- **Displays:**
  - Interactive AreaChart tracking weekly review volume and average ratings over time.
  - Side summary card displaying Average Sentiment Score (0–100 scale) and Total Analyzed Reviews count.
  - Mode toggle: `"Positive Sentiment"` vs `"Negative / Defect Signals"`.
- **Data Source:**
  - `GET /api/v1/overview/sentiment?mode={positive|negative}`
  - Backend queries `reviews` grouped by weekly truncation (`date_trunc('week', created_at)` in Postgres or `strftime` in SQLite) calculating count and average rating.
- **Interactions:**
  - Clicking **"Positive Sentiment"** or **"Negative / Defect Signals"** buttons triggers a refetch for the selected mode, re-rendering the Recharts SVG gradient area curves with smooth transitions.
  - Hovering over chart data points displays a custom tooltip with calendar week, review count, and weighted score.
- **States:**
  - **Loading:** Chart container renders an `animate-pulse` placeholder grid.
  - **With Data:** Full Recharts SVG area graph with teal/emerald gradient (positive) or rose/red gradient (negative).
  - **Empty:** Renders empty coordinate axes with an overlay `"No telemetry records found for this period"`.

---

### Component: Products Needing Attention Panel
- **Displays:**
  - Ranked list of top items flagged with urgent safety/quality degradation.
  - Each item shows: Product title, category, attention index score, verified signal count, and defect rationale (e.g., `"Multiple high-severity burn reports detected"`).
- **Data Source:**
  - `GET /api/v1/overview/products-needing-attention`
  - Backend queries `products` ordered by `current_risk` descending and joins active `safety_signals`.
- **Interactions:**
  - Clicking any product entry navigates to `/products/{asin}`.
- **States:**
  - **Loading:** 3 vertical skeleton placeholder blocks.
  - **With Data:** List of attention-item cards with severity-coded badges (rose for high risk, amber for moderate).
  - **Empty:** Displays `"Fleet status clear — no products currently require urgent intervention"`.

---

### Component: Live Product Risk Directory (Overview Table)
- **Displays:**
  - Paginated table containing: Product Model / Name, Category, Risk Score progress bar & badge, 30-Day Velocity trend, Defect Severity & Confidence, and Action link.
- **Data Source:**
  - `GET /api/v1/risk-queue/?page={page}&page_size=10`
- **Interactions:**
  - Client-side live search filter: Typing filters products by name, brand, or ASIN in real time.
  - Pagination buttons (`Previous` / `Next`): Fetches corresponding page chunk.
  - Clicking **"Inspect"**: Navigates to `/products/{id}`.
- **States:**
  - **Loading:** Table rows show skeleton loading pulses.
  - **With Data:** 10 records per page with status badges and color-coded risk bars.
  - **Empty:** `"No products match your search query."`

---

## 2. Risk Queue Page (`/risk-queue`)

**Purpose:**  
The central tactical triage queue for compliance analysts and product safety engineers. Prioritizes the entire product fleet using Bayesian risk scores, defect severity classifications, and signal velocity to prioritize safety reviews and regulatory disclosures.

---

### Component: Header & Active Queue Counter
- **Displays:**
  - Title: `"Live Risk Queue & Citation Diagnostics"`.
  - Counter badge: Total verified products currently evaluated in the database.
  - Pagination indicator: `"Page X of Y"`.
- **Data Source:**
  - `GET /api/v1/risk-queue/?page={page}&page_size=10&sort_by={sort}&min_risk={risk}&category={category}`
  - `total` and `total_pages` fields from API response.

---

### Component: Filter & Sort Controls Bar
- **Displays:**
  1. **Minimum Risk Score input:** Numerical input (0–100).
  2. **Category Filter dropdown:** `"All Categories"`, `"Musical Instruments"`, `"Cables & Accessories"`, `"Amplifiers & Effects"`.
  3. **Sort Order dropdown:** `"Highest Hazard Index"`, `"Most Safety Signals"`, `"Largest Lead Time"`.
- **Data Source:**
  - Reactive React state updating the URL and triggering `fetchQueueData`.
- **Interactions:**
  - Changing any filter automatically resets the page to `1` and queries the backend with the new parameters.
- **States:**
  - Inputs remain active and synchronized with current view state.

---

### Component: Risk Product Cards Grid
- **Displays:**
  - Responsive 3-column card grid containing:
    - **Hazard Level Badge:** `CRITICAL RISK` (>= 50), `ELEVATED RISK` (>= 30), or `LOW RISK` (< 30).
    - **Product Title & ASIN / Brand.**
    - **Risk Score Callout:** High-contrast square badge with 0–100 score.
    - **Signal Cluster Callout:** Quotation of verified defect cluster (e.g., `"Multiple high-severity burn reports detected"` or `"No active defect signals"`).
    - **Verified Signals Count:** Badge showing total confirmed signals.
    - **Lead Window:** Lead time weeks before official recall (e.g., `"7.4 wks early"` or `"N/A"` for non-recalled products).
    - **Status:** Recall status (e.g. `"Recalled"`, `"Under Monitoring"`).
    - **Inspect Product Action:** Button to inspect the product.
- **Data Source:**
  - `QueueItem` objects returned by `GET /api/v1/risk-queue/`.
- **Interactions:**
  - Clicking **"Inspect Product"**: Button displays an inline loading spinner and `"Inspecting..."` before navigating to `/products/{item.id}`.
- **States:**
  - **Loading:** 6 skeleton pulse cards mimicking the layout.
  - **With Data:** Full card layout with color-coded risk borders and badges.
  - **Empty:** Centered card with `"Not enough data yet — No products match your active risk filters."`

---

### Component: Pagination Controls (Top & Bottom)
- **Displays:**
  - Showing `[start]–[end]` of `[total]` matching products.
  - `Previous` and `Next` buttons.
- **Data Source:**
  - Computed from `page`, `totalItems`, and `totalPages`.
- **Interactions:**
  - Clicking `Previous` or `Next` increments/decrements page and updates route query params (`/risk-queue?page=N`).
  - Disabled when at the first or last page.

---

## 3. Alerts Page (`/alerts`)

**Purpose:**  
Enables safety teams to set threshold-based and natural-language automated monitoring directives, fire proactive alert evaluations across the fleet, and deliver real transactional safety emails via the Resend API to assigned compliance leads.

---

### Component: Header & Active Alerts Badge
- **Displays:**
  - Title: `"Critical Priority Alerts & Rule Engine"`.
  - Badge showing count of currently active system alerts in the database.
- **Data Source:**
  - Count of items returned by `GET /api/v1/alerts/`.

---

### Component: Natural Language Directive Compiler Form
- **Displays:**
  - Text input: `"e.g. Alert compliance team if any lithium battery thermal runaway exceeds 60% confidence"`.
  - Recipient email input: Defaults to `"safety-lead@company.internal"`.
  - Button: `"Compile & Deploy Directive"`.
- **Data Source:**
  - Submits to `POST /api/v1/alerts/rules`.
  - Backend uses pattern matching / LLM parsing to compile plain text directives into structured severity rules with target thresholds.
- **Interactions:**
  - Entering natural language text and submitting compiles the rule, displays a pending button state, and prepends the new compiled directive to the Active Directives list.
- **States:**
  - **Submitting:** Button changes to `"Compiling Rule..."` with disabled state.
  - **Success:** Field clears and new rule appears immediately in the directives table.

---

### Component: Proactive Alert Evaluation & Dispatch Bar
- **Displays:**
  - Action button: `"⚡ Fire Directives & Send Alerts"`.
  - Status banner showing recent dispatch outcome and Resend delivery receipts.
- **Data Source:**
  - `POST /api/v1/alerts/evaluate-and-dispatch`
  - Backend evaluates all active products against configured threshold directives (default >= 70.0), creates database `Alert` records, and dispatches transactional emails via `ResendDispatcher`.
- **Interactions:**
  - Clicking button triggers fleet evaluation. If a Resend API key is configured, emails are dispatched and the delivery status banner displays:
    `"Successfully evaluated directives and dispatched N alert emails to {recipient} via Resend."`
- **States:**
  - **Evaluating:** Button shows animated spinner with `"Evaluating Fleet & Sending Emails..."`.
  - **Completed:** Green success banner with dispatch counts and updated system alerts list.
  - **Error:** Red alert banner if API service is unreachable.

---

### Component: Active Monitoring Directives List
- **Displays:**
  - List of active directives showing: Directive ID, Natural language query text, parsed condition (`hazard_type`, `threshold`, `notification_channel`), and active status toggle.
- **Data Source:**
  - `GET /api/v1/alerts/rules`
- **Interactions:**
  - Status indicator displaying active deployment.
- **States:**
  - **Loading:** Displays loading skeletons.
  - **Empty:** `"No custom alert directives configured yet. Use the compiler above to create your first rule."`

---

### Component: Triggered System Alerts Feed
- **Displays:**
  - Chronological feed of fired alert instances with: Timestamp, Product ASIN/Title, Risk Score at trigger time, Triggering defect reason, and Resend delivery receipt ID (`resend_id`).
- **Data Source:**
  - `GET /api/v1/alerts/` (queries database `Alert` join `Product`).
- **Interactions:**
  - Deep-link to the affected product detail page.
- **States:**
  - **Empty:** `"No alerts triggered yet. Run fleet evaluation to check for directive breaches."`
  - **With Data:** Formatted cards displaying alert severity and delivery receipts.

---

## 4. Backtest Lab Page (`/backtest`)

**Purpose:**  
Validates early detection performance against historical ground truth recalls. Safety analysts and data scientists use this lab to calibrate alert sensitivity thresholds, measure historical lead time (weeks caught before official recall), calculate false positive rates, and export historical evaluation results to CSV.

---

### Component: Calibration Parameter Sliders
- **Displays:**
  - **Alert Threshold Slider:** Range from 10 to 90 (default 70).
  - **Signal Confidence Slider:** Range from 0.1 to 0.9 (default 0.4).
  - Selected values displayed dynamically next to labels.
- **Data Source:**
  - Local state passed as query parameters to `GET /api/v1/backtests/run?threshold={t}&min_confidence={c}`.
- **Interactions:**
  - Moving the slider updates the parameter in real time, debounces execution, and refetches backtest performance metrics.

---

### Component: Performance KPI Cards (4 Cards)
- **Displays:**
  1. **Median Lead Time:** Early detection window in weeks (e.g. `7.4 wks early`).
  2. **False Positive Rate:** Percentage of false alarms at current threshold (e.g. `4.2%`).
  3. **F1 Detection Score:** Harmonic mean of precision and recall (e.g. `0.91`).
  4. **Catalog Evaluated:** Total historical products and recalls evaluated in the test run.
- **Data Source:**
  - `GET /api/v1/backtests/run`
  - Calculated from real database records: compares first safety signal timestamp against official `Recall.recall_date`.
- **States:**
  - **Loading:** Shows `"..."` placeholder.
  - **With Data:** Displays calculated statistical metrics.

---

### Component: Historical Alert vs. Official Recall Timeline Chart
- **Displays:**
  - Dual-curve Recharts AreaChart comparing cumulative Early Warning Alerts fired vs. Official Regulatory Recalls published over historical monthly periods.
- **Data Source:**
  - `timeline` array from `GET /api/v1/backtests/run`.
- **Interactions:**
  - Hovering points reveals month-by-month alert counts and regulatory recall counts.
- **States:**
  - **Loading:** Skeleton placeholder block.
  - **With Data:** Visual area graph showing Early Warning curve leading before the Regulatory Recall curve.

---

### Component: Sensitivity Trade-Off Curve (ROC / Threshold Sweep)
- **Displays:**
  - Line chart showing how False Positive Rate and True Detection Rate vary as threshold is shifted from 10 to 90.
- **Data Source:**
  - `threshold_curve` array generated by `GET /api/v1/backtests/run`.

---

### Component: Historical Incident Cases Table & CSV Export
- **Displays:**
  - Table of validated historical products: Product Name, Brand, Lead Time Window (wks), Official Recall Date, First Signal Date, and Detection Status (`Caught Early` / `Missed`).
  - Button: `"Download Historical Backtest CSV"`.
- **Data Source:**
  - Table: `incidents` list from `GET /api/v1/backtests/run`.
  - CSV Export: `GET /api/v1/backtests/export?format=csv&threshold={t}&min_confidence={c}`.
- **Interactions:**
  - Clicking **"Download Historical Backtest CSV"**: Directs browser to stream the CSV file directly from the FastAPI backend endpoint.
- **States:**
  - **With Data:** Complete incident log with green badges for items caught early.
  - **Empty:** `"No historical recall cases found in database."`

---

## 5. Ask EarlyEcho AI (`/ask`)

**Purpose:**  
An interactive safety investigation copilot supporting two distinct operational modes:
1. **Grounded RAG Mode:** Deterministic, SQL-grounded querying over safety reviews, verified defect signals, and catalog statistics with direct evidence citations and interactive table exports.
2. **AI Chat Mode (NVIDIA NIM):** Deep conversational safety investigator powered by NVIDIA NIM large language models, providing defect root-cause analysis, timeline reasoning, and peer-product risk comparisons.

---

### Component: Mode Toggle Pill
- **Displays:**
  - Two buttons: `[ 🔍 RAG Mode ]` and `[ 🤖 AI Chat (NVIDIA NIM) ]`.
  - Active mode highlighted with distinct colors (Emerald for RAG, Indigo for NIM).
  - Contextual helper text explaining current reasoning mode.
- **Data Source:**
  - Client state controlling the `mode` parameter sent to `POST /api/v1/chat/`.
- **Interactions:**
  - Clicking toggles between RAG mode and AI Chat mode.

---

### Component: Product Drill-Down Input Bar
- **Displays:**
  - Text input for optional target Product ASIN / Model ID (e.g. `B0002D0B4K`).
  - Helper note: `"Focuses investigation specifically on this product's telemetry."`
- **Data Source:**
  - Included as `product_id` in chat requests.
- **Interactions:**
  - Typing an ASIN restricts assistant analysis to the target product.

---

### Component: Quick Sample Question Pills
- **Displays:**
  - Clickable sample queries:
    - `"Show highest risk products with burn signals"`
    - `"Compare failure rates across categories"`
    - `"Which products have lead time > 4 weeks?"`
- **Interactions:**
  - Clicking any pill immediately submits that query in the active mode.

---

### Component: Conversational Message Feed
- **Displays:**
  - Chronological chat thread with distinct styling for User and Assistant.
  - Mode indicator tag on each response (`Grounded RAG` or `NVIDIA NIM Copilot`).
  - Formatted analytical answer text.
  - **Direct Evidence Citations:** Clickable tags with review IDs (e.g. `[R-101]`, `[REV-B000...]`).
  - **SQL Data Tables (RAG Mode):** Interactive grid rendering columns and rows returned by database queries.
  - **CSV Export Button (RAG Mode):** Download button to export the SQL query table directly to `.csv`.
  - **Product Detail Card (Drill-Down Mode):** Card with Risk Score, Category, and active signal clusters.
  - **Peer Comparison Cards (AI Chat Mode):** Comparative cards showing similar category products with relative risk scores and signal counts.
- **Data Source:**
  - `POST /api/v1/chat/`
  - Body: `{ "query": "...", "mode": "rag" | "ai_chat", "product_id": "..." }`
- **Interactions:**
  - Clicking **"Download CSV"** generates an instant client-side CSV download from the embedded table data.
- **States:**
  - **Loading:** Displays animated bouncing loading dots with `"Analyzing safety telemetry and running evidence queries..."`.
  - **Error:** Renders error notice if connection fails.

---

## 6. Data Quality Page (`/data-quality`)

**Purpose:**  
Provides transparency into data pipeline health, ingestion record counts, and database sync status across customer reviews, regulatory safety reports, and multi-layer defect detection signals. Used by Data Engineers and ML Ops to verify pipeline reliability.

---

### Component: Pipeline Sync Status Header
- **Displays:**
  - Title: `"Data Feed Ingestion Health & Telemetry Status"`.
  - Badge: `"Database Sync Active"`.
  - Subtitle describing ingestion sources.
- **Data Source:**
  - `GET /api/v1/data-quality/`.

---

### Component: Ingestion Metric Cards (4 Cards)
- **Displays:**
  1. **Monitored Products:** Real count of registered product models in database.
  2. **Amazon Marketplace Reviews:** Real count of ingested review records.
  3. **CPSC / SaferProducts.gov:** Real count of official regulatory reports.
  4. **Safety Signals Detected:** Real count of multi-layer defect signals.
- **Data Source:**
  - `GET /api/v1/data-quality/` -> `ingestion_summary` object.
  - SQL: Queries real `products`, `reviews`, `safety_reports`, and `safety_signals` table counts.
- **States:**
  - **Loading:** Displays `"..."`.
  - **With Data:** Displays exact numerical metrics.

---

### Component: Data Provenance & System Health Cards
- **Displays:**
  1. **Database Health:** `"Healthy"` (SQLite / PostgreSQL Operational).
  2. **Vector Search Coverage:** `"100% Vectorized"` (pgvector HNSW / SentenceTransformer).
  3. **Background Processing:** `"Idle / Ready"` (Celery Worker Async Scheduler).
- **Code Audit & Real-world Behavior:**
  > [!NOTE]
  > **Implementation Detail:** In the current backend implementation (`apps/api/app/api/v1/data_quality.py`), `database`, `vector_search`, and `worker_status` are static string fields returned by the endpoint rather than dynamic heartbeat probes. The review and signal counts, however, are 100% live database table counts.

---

## 7. Product Detail Page (`/products/[id]`)

**Purpose:**  
The definitive deep-dive investigation page for a single product model. Displays granular defect clusters, Bayesian hazard scores, early warning lead times, official CPSC recall alerts, and verified customer review evidence citations. Used by safety investigators to confirm root causes and assemble evidence dossiers.

---

### Component: Navigation Breadcrumb
- **Displays:**
  - `"← Back to Risk Queue"`.
- **Interactions:**
  - Navigates back to `/risk-queue`.

---

### Component: Product Hero Banner Card
- **Displays:**
  - **Status Classification Badge:** `CRITICAL HAZARD CLASSIFICATION` (risk score >= 70) or `MONITORED PRODUCT` (risk score < 70).
  - **Product ID / ASIN:** Font-mono model identifier.
  - **Product Name & Brand / Category.**
  - **Description:** Product description text if available in database.
  - **Signal Cluster Callout:** Quotation of verified defect cluster (e.g. `"Multiple high-severity burn reports detected"` or `"No active defect signals"`).
  - **Hazard Score (0–100):** Prominent numeric score with color coding (red for >= 70, slate for lower).
  - **Early Lead Window:** Number of weeks the signal was caught prior to official recall (e.g., `7.4 wks early` or `N/A`).
- **Data Source:**
  - `GET /api/v1/products/{id}`.

---

### Component: Official CPSC Recall Action Alert Banner
- **Displays:**
  - Amber warning box rendered **only** if the product has an active regulatory recall record (`recall.is_recalled === true`).
  - Displays: Formal hazard description and official regulatory recall date.
- **Data Source:**
  - `recall` object from `GET /api/v1/products/{id}` (joined from `Recall` table).
- **States:**
  - Hidden if product has no official recall on file.
  - Visible with alert icon when recalled.

---

### Component: Verified Customer Evidence Citations Panel
- **Displays:**
  - Header with total verified citation count: `"Verified Customer Evidence Citations (N)"`.
  - List of individual customer review citation cards:
    - **Citation Identifier:** (e.g. `REV-B0002D0B4K-1`).
    - **Star Rating:** Visual rating display (e.g. `5 ★`, `1 ★`).
    - **Matched Defect Signal:** Rose badge quoting the matched defect keyword/phrase (e.g. `"caught fire"`, `"burn"`).
    - **Review Date:** Timestamp of review publication.
    - **Review Text:** Verbatim quotation of customer feedback.
- **Data Source:**
  - `reviews` array from `GET /api/v1/products/{id}`.
- **Deduplication Safeguard:**
  - Automatically deduplicates review citations on both backend and frontend based on unique text content to eliminate repeat ingestion artifacts.
- **States:**
  - **Loading:** Displays loading indicator.
  - **With Data:** Clean list of distinct customer reviews with highlighted defect tags.
  - **Empty:** `"No customer review citations found for this product."`

---

## 8. Pitch Alignment Gap Report

### Context: Intended Pitch
> *"Let's take an example close to home — Kreativan Technologies. Imagine you launch a new product/software/device. Customers buy it, use it, and post feedback — reviews, support tickets, app store comments. But nobody at Kreativan is systematically reading all of that. So when a product quietly underperforms or fails, you often don't know why until it's too late — was it a bug, a design flaw, a safety issue, bad UX, wrong market fit? That's exactly the blind spot EarlyEcho solves: instead of guessing after the fact, it continuously reads your own customer feedback, detects the warning signals early, scores the risk, and explains — with evidence — what's actually going wrong and when it started."*

---

### Honest Feature-by-Feature Gap Assessment

| Pitch Element | Implementation Status | Current Reality in Codebase |
| :--- | :--- | :--- |
| **"Continuously reads your own customer feedback (reviews, support tickets, app store comments)"** | **Partially Matches / Major Gap** | • The application has ingestion scripts (`scripts/ingest_amazon_csv.py`), but it is currently preloaded and configured around Amazon review datasets (specifically `Musical_instruments_reviews.csv`).<br>• There is **no self-service UI or generic API connector** for an organization like Kreativan to upload support tickets (Zendesk, Jira), app store comments (Google Play, iOS App Store), or custom CSVs via the dashboard.<br>• Data ingestion requires running command-line Python scripts rather than an automated continuous ingestion webhook or pipeline. |
| **"Detects the warning signals early (lead time before failure)"** | **Matches** | • The Backtest Lab (`/backtest`) and Product Detail (`/products/[id]`) compute real lead times dynamically from timestamps in the database.<br>• When a product has safety signals and an official recall date, lead time is calculated as `(Recall.recall_date - first_signal.detected_at).days / 7.0`.<br>• For non-recalled products, the UI correctly displays `"N/A"` rather than fabricating artificial lead times. |
| **"Scores the risk"** | **Matches** | • Products receive a 0–100 Hazard Score calculated by the Bayesian risk engine based on verified safety signals.<br>• With recent bug fixes, false positives (such as 5-star audio reviews mentioning "sound bleeding") are filtered out, and risk scores are strictly bound to genuine defect complaint reviews belonging to that specific product. |
| **"Explains — with evidence — what's actually going wrong and when it started"** | **Matches** | • Grounded citations (`[REV-...]`) display verbatim customer review snippets, star ratings, and matched defect terms.<br>• Defect clusters identify the specific hazard (e.g. burn, fire, mechanical failure).<br>• Review timestamps and the Backtest monthly timeline establish when signals first emerged. |
| **"Flexible enough to onboard a different company's own data (support tickets, any product category)"** | **Missing Entirely** | • The data model assumes Amazon schema fields (`asin`, `reviewerID`, `helpful`, `overall`).<br>• There is **no multi-tenant organization model** (e.g., Kreativan Technologies cannot create a workspace, define custom taxonomy categories, or connect webhooks).<br>• Classification lexicons are tuned for hardware/physical product safety defects (burn, fire, shock, laceration) rather than general software bugs, UX friction, or SaaS market fit issues. |

---

### Summary of What Matches, What Partially Matches, and What Is Missing

#### What Matches:
1. **Interpretable Risk Scoring:** 0–100 Hazard Score reflects real verified safety complaints tied directly to the product.
2. **Evidence-Backed Explanations:** Customer quotes, star ratings, and timestamps are cited directly, both in the UI and in RAG/NIM AI chat responses.
3. **Early Warning Calculation:** Lead times are mathematically computed between first detected signal and official recall dates.
4. **Interactive Backtesting:** Analysts can test threshold sensitivity against historical incidents and export results.

#### What Partially Matches:
1. **Continuous Ingestion:** Works via Python CLI scripts against CSVs, but lacks an automated continuous stream or scheduled crawler for live marketplace listings.
2. **System Health Indicators:** Table counts on the Data Quality screen are 100% real, but status indicators (`Healthy`, `Vectorized`) are static status strings.

#### What Is Missing Entirely:
1. **Generic "Bring-Your-Own-Data" Ingestion:** No web UI or multi-source API endpoint for uploading Zendesk tickets, Jira issues, Intercom chats, or Google Play/App Store reviews.
2. **Multi-Tenancy & Workspace Isolation:** The app operates on a single global database catalog without organization-level data segregation.
3. **Software/UX Defect Taxonomies:** The multi-layer detection rules focus on physical and electrical hazards (burn, shock, fire, injury) and would require custom NLP lexicons to detect software crashes, UX bugs, or SaaS onboarding drop-offs.
