from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.models import Alert, AlertRule, AlertEvidence, Product
from app.schemas.schemas import RuleCreateSchema
from app.alerts.rule_parser import NaturalLanguageRuleParser

router = APIRouter()
rule_parser = NaturalLanguageRuleParser()

@router.get("/")
def get_alerts(db: Session = Depends(get_db)):
    alerts = db.query(Alert).order_by(Alert.triggered_at.desc()).all()
    results = []
    for a in alerts:
        prod = db.query(Product).filter(Product.id == a.product_id).first()
        evidence = db.query(AlertEvidence).filter(AlertEvidence.alert_id == a.id).all()
        results.append({
            "id": a.id,
            "product_id": a.product_id,
            "product_name": prod.name if prod else "Unknown",
            "category": prod.category if prod else "General",
            "alert_type": a.alert_type,
            "risk_score": a.risk_score,
            "confidence": a.confidence,
            "status": a.status,
            "triggered_at": a.triggered_at.strftime("%Y-%m-%d"),
            "evidence_count": len(evidence),
            "explanation": a.explanation
        })
    return results

@router.get("/rules")
def get_alert_rules(db: Session = Depends(get_db)):
    return db.query(AlertRule).all()

@router.post("/rules")
def create_alert_rule(payload: RuleCreateSchema, db: Session = Depends(get_db)):
    parsed = rule_parser.parse(payload.text)
    rule = AlertRule(
        name=parsed["name"],
        description=f"Natural Language Directive: '{payload.text}'",
        rule_type=parsed["rule_type"],
        configuration=parsed["configuration"],
        enabled=True
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return {
        "rule": rule,
        "parsed_spec": parsed
    }
