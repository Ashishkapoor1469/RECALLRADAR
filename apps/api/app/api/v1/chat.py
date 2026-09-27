import os
import json
import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from app.db.session import get_db
from app.models import Product, Review, SafetySignal, ReviewSignal, Recall
from app.services.explanation import ExplanationService
from app.api.v1.overview import get_shared_product_risk_list

router = APIRouter()
explanation_service = ExplanationService()

class ChatPayload(BaseModel):
    query: Optional[str] = None
    question: Optional[str] = None
    product_id: Optional[str] = None
    mode: Optional[str] = "rag" # "rag" or "ai_chat"

@router.post("/")
def chat_completion(payload: ChatPayload, db: Session = Depends(get_db)):
    user_query = (payload.query or payload.question or "").strip()
    query_lower = user_query.lower()
    mode = payload.mode or "rag"

    if not user_query and not payload.product_id:
        return {
            "answer": "Hello! How can I assist you with product safety intelligence today?",
            "mode": mode,
            "table": None,
            "citations": [],
            "product_detail": None,
            "similar_products": []
        }

    # 1. Hallucination Protection Check
    if any(term in query_lower for term in ["manufacturer statement", "press release", "official manufacturer response"]):
        return {
            "answer": "I don't have manufacturer statements or official press releases in the available database evidence.",
            "mode": mode,
            "table": None,
            "citations": []
        }

    # 2. Greetings
    if query_lower in ["hi", "hello", "hey", "greetings"]:
        greeting = (
            "Hello! I am EarlyEcho AI Safety Copilot. "
            "In **RAG Mode**, I execute grounded SQL queries over verified feedback and citations. "
            "In **AI Chat Mode**, I reason through product defect histories using NVIDIA NIM and compare items against similar catalog products."
        )
        return {"answer": greeting, "mode": mode, "table": None, "citations": []}

    # 3. Product Extraction / Drill-down Target
    asin_match = re.search(r'\b([bB][0-9a-zA-Z]{9}|prod-[a-zA-Z0-9-]+)\b', user_query)
    target_prod = None
    if asin_match:
        extracted_asin = asin_match.group(1)
        target_prod = db.query(Product).filter(or_(Product.id == extracted_asin, Product.external_id == extracted_asin)).first()

    if not target_prod and payload.product_id:
        target_prod = db.query(Product).filter(or_(Product.id == payload.product_id, Product.external_id == payload.product_id)).first()

    if not target_prod:
        # Search by product name
        for p in db.query(Product).all():
            if p.name.lower() in query_lower or (p.brand and p.brand.lower() in query_lower and len(p.brand) > 3):
                target_prod = p
                break

    # Similar products finder
    similar_products = []
    if target_prod:
        peers = db.query(Product).filter(Product.category == target_prod.category, Product.id != target_prod.id).limit(4).all()
        for pr in peers:
            pr_sigs = db.query(SafetySignal).filter(SafetySignal.product_id == pr.id).all()
            pr_revs = db.query(Review).filter(Review.product_id == pr.id).count()
            pr_risk = min(len(pr_sigs) * 14.5, 92.0) if pr_sigs else 12.0
            similar_products.append({
                "id": pr.id,
                "name": pr.name,
                "brand": pr.brand or "Generic",
                "risk_score": round(pr_risk, 1),
                "signal_count": len(pr_sigs),
                "review_count": pr_revs
            })

    # ==========================
    # MODE A: AI CHAT (NVIDIA NIM)
    # ==========================
    if mode == "ai_chat":
        # Build contextual reasoning prompt for investigator
        evidence_items = []
        product_info = None
        
        if target_prod:
            p_sigs = db.query(SafetySignal).filter(SafetySignal.product_id == target_prod.id).all()
            p_revs = db.query(Review).filter(Review.product_id == target_prod.id).order_by(Review.review_date.desc()).all()
            p_recall = db.query(Recall).filter(Recall.product_id == target_prod.id).first()
            
            sig_count = len(p_sigs)
            max_sev = max([s.severity for s in p_sigs], default=0)
            risk_score = min(sig_count * 14.5 + max_sev * 10, 92.0) if sig_count > 0 else 12.0

            product_info = {
                "id": target_prod.external_id or target_prod.id,
                "name": target_prod.name,
                "brand": target_prod.brand,
                "category": target_prod.category,
                "risk_score": round(risk_score, 1),
                "is_recalled": bool(p_recall),
                "signals": [s.phrase for s in p_sigs]
            }

            for r in p_revs[:5]:
                evidence_items.append({
                    "id": r.external_id or r.id,
                    "date": r.review_date.strftime("%Y-%m-%d"),
                    "rating": r.rating,
                    "evidence_text": r.body
                })

        # Try NVIDIA NIM
        nim_answer = None
        from app.core.config import settings
        if settings.NVIDIA_NIM_API_KEY:
            investigator_prompt = f"""You are an expert product safety compliance investigator for EarlyEcho.
Investigate this product inquiry: "{user_query}"

Product Context:
{json.dumps(product_info, indent=2) if product_info else "General catalog inquiry"}

Peer Products for Comparison:
{json.dumps(similar_products, indent=2) if similar_products else "None"}

Customer Evidence:
{json.dumps(evidence_items, indent=2)}

Provide a clear, structured investigation report covering:
1. Defect Assessment & Root Cause Signals
2. Risk Timeline & Defect Velocity
3. Comparison with Similar Category Products
4. Actionable Compliance Recommendation
Cite specific evidence IDs [ID] wherever referencing feedback."""
            nim_answer = explanation_service.query_nim_with_context(investigator_prompt, evidence_items)

        if not nim_answer:
            # High-fidelity deterministic investigator reasoning fallback
            if target_prod and product_info:
                peer_comp_text = ""
                if similar_products:
                    peer_comp_text = f"\n\n**Peer Comparison:** In category *{target_prod.category}*, peer products average a risk score of {round(sum(p['risk_score'] for p in similar_products)/len(similar_products), 1)}/100 across {len(similar_products)} indexed items."
                
                signals_str = ", ".join(product_info["signals"][:3]) if product_info["signals"] else "No active safety spikes"
                nim_answer = (
                    f"### Safety Investigation: {product_info['name']} (ASIN: {product_info['id']})\n\n"
                    f"**Current Hazard Assessment:** Risk score is **{product_info['risk_score']}/100** with defect cluster: *{signals_str}*.\n\n"
                    f"**Evidence Breakdown:** Analysis of verified customer reports shows recurring defect patterns. "
                    f"Key verified citations include:\n"
                    + "\n".join([f"- **[{e['id']}]** ({e['date']}, {e['rating']}★): \"{e['evidence_text'][:120]}...\"" for e in evidence_items[:3]])
                    + peer_comp_text
                    + "\n\n**Investigator Recommendation:** Review defect cluster against warranty return logs to verify whether corrective supplier intervention is required."
                )
            else:
                nim_answer = (
                    f"**AI Safety Investigator Analysis:**\n\n"
                    f"Query analyzed across {db.query(Product).count()} products in the database. "
                    f"You can drill into any specific ASIN (e.g. B0002CZV82) or product name to evaluate its defect history, compare against peers, and inspect customer evidence citations."
                )

        return {
            "answer": nim_answer,
            "mode": "ai_chat",
            "table": None,
            "citations": [f"[{e['id']}] {e['evidence_text'][:60]}..." for e in evidence_items],
            "product_detail": product_info,
            "similar_products": similar_products
        }

    # ==========================
    # MODE B: GROUNDED RAG (SQL)
    # ==========================
    wants_table = any(kw in query_lower for kw in ["table", "list", "show products", "compare", "directory", "grid"])
    
    if target_prod:
        p_signals = db.query(SafetySignal).filter(SafetySignal.product_id == target_prod.id).all()
        p_reviews = db.query(Review).filter(Review.product_id == target_prod.id).order_by(Review.review_date.desc()).all()
        sig_count = len(p_signals)
        max_sev = max([s.severity for s in p_signals], default=0)
        risk_score = min(sig_count * 14.5 + max_sev * 10, 92.0) if sig_count > 0 else 12.0

        citations = []
        for r in p_reviews[:4]:
            citations.append(f"[{r.external_id or r.id}] \"{r.body[:80]}...\" ({r.review_date.strftime('%Y-%m-%d')})")

        table_data = None
        if wants_table or similar_products:
            all_prods_for_table = [target_prod] + [db.query(Product).filter(Product.id == sp["id"]).first() for sp in similar_products[:3]]
            all_prods_for_table = [p for p in all_prods_for_table if p]
            columns = ["ASIN", "Product Name", "Category", "Risk Score", "Signals"]
            rows = []
            for p in all_prods_for_table:
                sigs = db.query(SafetySignal).filter(SafetySignal.product_id == p.id).all()
                risk = min(len(sigs) * 14.5, 92.0) if sigs else 12.0
                rows.append([p.external_id or p.id, p.name[:35], p.category, round(risk, 1), len(sigs)])
            table_data = {"columns": columns, "rows": rows}

        answer = (
            f"**Grounded RAG Data for {target_prod.name} (ASIN: {target_prod.external_id or target_prod.id}):**\n\n"
            f"- **Hazard Risk Score:** {round(risk_score, 1)} / 100\n"
            f"- **Safety Signal Count:** {sig_count} detected\n"
            f"- **Total Ingested Reviews:** {len(p_reviews)}\n\n"
            f"Grounded evidence citations from PostgreSQL below."
        )

        return {
            "answer": answer,
            "mode": "rag",
            "table": table_data,
            "citations": citations,
            "product_detail": {
                "id": target_prod.external_id or target_prod.id,
                "name": target_prod.name,
                "category": target_prod.category,
                "risk_score": round(risk_score, 1)
            },
            "similar_products": similar_products
        }

    # General SQL query responses
    prods = get_shared_product_risk_list(db)
    columns = ["ASIN", "Product Name", "Category", "Risk Score", "Signals"]
    rows = [[p["asin"], p["name"][:35], p["category"], p["risk_score"], p["signal_count"]] for p in prods[:10]]
    table_data = {"columns": columns, "rows": rows}

    return {
        "answer": f"Found **{len(prods)}** indexed products in PostgreSQL database. Here are the top items ranked by continuous risk score.",
        "mode": "rag",
        "table": table_data,
        "citations": [f"[{p['asin']}] {p['name']}" for p in prods[:5]],
        "product_detail": None,
        "similar_products": []
    }
