# RecallRadar — System Architecture & Component Design

RecallRadar is structured as a modular enterprise platform separating frontend, backend API, data ingestion, machine learning, and background processing workers.

## Architectural Diagram

```text
               +----------------------------------+
               |        Next.js Web App           |
               |      (TypeScript, Tailwind)      |
               +----------------+-----------------+
                                | REST API / CORS
                                v
               +----------------+-----------------+
               |       FastAPI Backend API        |
               |      (Python 3.11, Pydantic)     |
               +-------+----------------+---------+
                       |                |
         +-------------+                +-------------+
         |                                            |
         v                                            v
+------------------+                        +------------------+
| PostgreSQL 16    |                        | Redis 7 & Celery |
| + pgvector       |                        | Async Task Queue |
+------------------+                        +------------------+
```

## System Components

1. **Ingestion Layer**:
   - `CPSCAdapter`, `SaferProductsAdapter`, `AmazonReviewsAdapter`, `SyntheticDataAdapter`.
   - Normalization, deduplication, and data provenance storage.

2. **Embedding & Safety Signal Detection**:
   - 384-dimensional vector embeddings stored directly in PostgreSQL (`pgvector`).
   - 5-layer safety detector (Lexicon, Regex patterns, Semantic similarity, Severity 0-4, Contextual disambiguation).

3. **Defect Clustering & Risk Engine**:
   - Semantic clustering of complaint themes.
   - Interpretable Risk Engine computing 0-100 normalized scores with additive score breakdowns.

4. **Alerts & Natural Language Parser**:
   - Threshold evaluation, confidence rating (High/Med/Low), evidence link attachment.
   - Natural language directive parser to validated JSON schemas.

5. **NVIDIA NIM & RAG Conversational Engine**:
   - Grounded LLM explanations with mandatory citation IDs (`[R-101]`).
   - Offline fallback engine for zero-dependency execution.
   - RAG retrieval over `pgvector` database with hallucination refusal logic.

6. **Backtest Lab & Alert Budget Simulator**:
   - Zero-leakage temporal evaluation.
   - Interactive Alert Budget curve simulator.
