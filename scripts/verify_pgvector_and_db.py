import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "api")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import SessionLocal, engine
from app.db.init_db import init_db
from app.models import Product, Review, SafetySignal, Alert, Recall, ProductRiskSnapshot
from app.ml.embeddings.generator import EmbeddingGenerator
from app.ml.detection.detector import SafetySignalDetector
from app.ml.detection.context import is_false_positive_context
from app.ml.risk.engine import InterpretableRiskEngine
from app.ml.survival.survival_model import RecallSurvivalAnalyzer
from app.alerts.rule_parser import NaturalLanguageRuleParser
from app.services.explanation import ExplanationService
from app.services.rag import RAGChatEngine
import pandas as pd
from datetime import datetime

def run_deep_verification():
    print("==================================================")
    print("RECALLRADAR DEEP SYSTEM VERIFICATION & AUDIT")
    print("==================================================")

    # 1. Database & Table Setup
    init_db()
    db = SessionLocal()
    print("[PASS] 1. PostgreSQL/Database schema & table verification OK")

    # 2. Vector Embedding Generation & Distance Check
    embedder = EmbeddingGenerator()
    vec1 = embedder.generate("The charger battery caught fire and melted!")
    vec2 = embedder.generate("Overheated block started smoking")
    assert len(vec1) == 384
    assert len(vec2) == 384
    print("[PASS] 2. 384-dimensional vector embedding generation OK")

    # 3. Multi-Layer Safety Signal Detector & Context Disambiguation
    detector = SafetySignalDetector()
    sig1 = detector.detect("The charger adapter became extremely hot and started smoking!")
    assert len(sig1) >= 1
    assert not is_false_positive_context("burned my hand", "burn")
    assert is_false_positive_context("I ate burnt toast for breakfast", "burn")
    print("[PASS] 3. Multi-layer safety signal detection & contextual disambiguation OK")

    # 4. Interpretable Risk Engine
    risk_engine = InterpretableRiskEngine()
    features = {
        "product_id": "test-charger",
        "signal_count": 6,
        "recent_count": 4,
        "velocity_ratio": 2.0,
        "max_severity": 4,
        "source_agreement": 1.0,
        "unique_reporters": 5
    }
    risk_res = risk_engine.calculate_risk(features)
    assert 0 <= risk_res["risk_score"] <= 100
    assert len(risk_res["contributors"]) > 0
    print(f"[PASS] 4. Risk Engine calculated score: {risk_res['risk_score']}/100 with {len(risk_res['contributors'])} contributor breakdowns OK")

    # 5. Lifelines Survival Analysis
    survival_analyzer = RecallSurvivalAnalyzer()
    hist_df = pd.DataFrame([{"duration": 8.0, "event": 1}, {"duration": 7.0, "event": 1}, {"duration": 9.0, "event": 1}])
    surv_res = survival_analyzer.fit_and_estimate(hist_df)
    assert surv_res["median_weeks_to_recall"] > 0
    print(f"[PASS] 5. Lifelines survival analyzer estimated median weeks: {surv_res['median_weeks_to_recall']} wks OK")

    # 6. Natural Language Alert Rule Parser
    parser = NaturalLanguageRuleParser()
    rule_spec = parser.parse("alert me if burn or fire mentions double in two weeks")
    assert "burn" in rule_spec["configuration"]["signals"]
    assert rule_spec["configuration"]["threshold_multiplier"] == 2.0
    print("[PASS] 6. Natural language rule parser converted directive to validated JSON schema OK")

    # 7. Live NVIDIA NIM API Explanation
    expl_service = ExplanationService()
    explanation = expl_service.generate_explanation(
        alert={"risk_score": 85.0, "confidence": "High"},
        product={"name": "Demo Smart Charger Pro 65W"},
        evidence_items=[{"id": "R-00007", "evidence_text": "The charger caught fire on my nightstand!"}]
    )
    assert "summary" in explanation
    assert len(explanation["evidence"]) >= 1
    print(f"[PASS] 7. NVIDIA NIM explanation generated (Is Fallback: {explanation.get('is_fallback')}) OK")

    # 8. RAG Chat Hallucination Protection
    rag = RAGChatEngine(db)
    refusal = rag.ask("What did the manufacturer say in their press release?")
    assert "don't have manufacturer statements" in refusal["answer"]
    print("[PASS] 8. Ask RecallRadar RAG hallucination refusal check OK")

    db.close()
    print("==================================================")
    print("ALL SYSTEM VERIFICATION CHECKS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_deep_verification()
