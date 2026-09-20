# RecallRadar — REST API Endpoints Documentation

## Base URL
`http://localhost:8000/api/v1`

## Endpoints Summary

### Products & Risk Queue
- `GET /health` — API health check.
- `GET /api/v1/products/` — List monitored products (supports `page`, `page_size`, `category`, `search`).
- `GET /api/v1/products/{id}` — Retrieve product detail, risk score, confidence, and recall status.
- `GET /api/v1/products/{id}/timeline` — Get historical week-by-week risk score trajectory.
- `GET /api/v1/risk-queue/` — Analytical Risk Queue table items (supports `min_risk`, `category`, `sort_by`).

### Alerts & Rules
- `GET /api/v1/alerts/` — List active and historical safety alerts.
- `GET /api/v1/alerts/rules` — List alert rules.
- `POST /api/v1/alerts/rules` — Parse and create custom alert rule from natural language.

### Backtesting & RAG
- `POST /api/v1/backtests/` — Execute historical backtest run with specified alert budget.
- `GET /api/v1/backtests/{id}` — Get backtest run details and lead time metrics.
- `POST /api/v1/ask/` — Ask RecallRadar conversational RAG chat endpoint.
- `GET /api/v1/data-quality/` — Data quality and ingestion metrics.
- `POST /api/v1/demo/load` — Load offline synthetic dataset.
- `POST /api/v1/demo/reset` — Reset demo state.
