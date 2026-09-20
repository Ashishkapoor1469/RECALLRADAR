# RecallRadar — Architecture Decision Log (ADR)

## ADR-001 — PostgreSQL 16 + pgvector Extension
- **Date**: 2026-09-20
- **Status**: Accepted
- **Context**: RecallRadar requires semantic search over review text and safety reports to cluster defects and power RAG retrieval.
- **Decision**: Use PostgreSQL 16 with the `pgvector` extension instead of adding a separate vector database (such as Pinecone, Qdrant, or Weaviate).
- **Rationale**: Keeps transactional data, embeddings, risk snapshots, and evidence in a single ACID-compliant database. Eliminates distributed sync issues and operational complexity.

---

## ADR-002 — Python FastAPI + Next.js Monorepo Architecture
- **Date**: 2026-09-20
- **Status**: Accepted
- **Context**: The application combines heavy ML pipelines (lifelines, sentence-transformers, scikit-learn) with a high-performance, responsive enterprise web dashboard.
- **Decision**: Adopt a monorepo structure with Next.js 14+ (TypeScript, Tailwind, TanStack Query) in `apps/web` and FastAPI (Python 3.11, Pydantic v2, SQLAlchemy 2) in `apps/api`.
- **Rationale**: Python provides native ecosystem access to scientific computing and LLM libraries. Next.js provides modern server and client components, server side rendering, and optimal UI performance.

---

## ADR-003 — Celery + Redis Task System with Idempotent Workers
- **Date**: 2026-09-20
- **Status**: Accepted
- **Context**: Data ingestion, embedding generation, signal clustering, and backtest execution can be computationally heavy.
- **Decision**: Deploy Redis 7 as broker and Celery as worker/scheduler. All task handlers must be written to be strictly idempotent.
- **Rationale**: Ensures tasks can be safely retried upon failure without creating duplicate review records, risk snapshots, or vector embeddings.

---

## ADR-004 — NVIDIA NIM Explanation Integration with Local Deterministic Fallback
- **Date**: 2026-09-20
- **Status**: Accepted
- **Context**: NVIDIA NIM microservices will generate rich natural-language explanations for safety alerts, but the application must run fully offline when no API key is provided.
- **Decision**: Build an `ExplanationService` that routes to NVIDIA NIM when available and falls back to a deterministic rule-based generator when `NVIDIA_NIM_API_KEY` is omitted or calls fail.
- **Rationale**: Guarantees zero downtime, offline demonstration capability, and strict test suite stability regardless of cloud endpoint connectivity.

---

## ADR-005 — Strict Temporal Leakage Prevention Architecture
- **Date**: 2026-09-20
- **Status**: Accepted
- **Context**: Risk calculation and historical backtests must compute metrics based exclusively on information available at timestamp $T$.
- **Decision**: Enforce timestamp filtering (`review_date <= snapshot_date`) in all feature queries and survival dataset builders.
- **Rationale**: Prevents future reviews or recalls from corrupting historical risk scores or lead-time evaluations.
