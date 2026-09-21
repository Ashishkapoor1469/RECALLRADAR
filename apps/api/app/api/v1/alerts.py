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
    if not alerts:
        # Dynamically generate alerts for real database products with safety signals
        signals = db.query(SafetySignal).all()
        prods_with_signals = {}
        for s in signals:
            prods_with_signals.setdefault(s.product_id, []).append(s)

        for p_id, p_sigs in prods_with_signals.items():
            prod = db.query(Product).filter(Product.id == p_id).first()
            if not prod:
                continue
            max_sev = max([s.severity for s in p_sigs], default=1)
            risk_score = min(len(p_sigs) * 14.5 + max_sev * 10, 92.0)
            phrases = list(set([s.phrase for s in p_sigs]))
            
            new_alert = Alert(
                product_id=p_id,
                alert_type="SAFETY_SIGNAL_SPIKE",
                risk_score=round(risk_score, 1),
                confidence="HIGH" if len(p_sigs) > 1 or max_sev >= 3 else "MEDIUM",
                status="ACTIVE",
                triggered_at=p_sigs[-1].detected_at,
                explanation=f"Critical safety signal detected for {prod.name}. Triggered keywords: '{', '.join(phrases)}' in customer reviews."
            )
            db.add(new_alert)
        db.commit()
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
            "triggered_at": a.triggered_at.strftime("%Y-%m-%d") if a.triggered_at else "2024-03-15",
            "evidence_count": len(evidence) or 1,
            "explanation": a.explanation
        })
    return results

@router.get("/rules")
def get_alert_rules(db: Session = Depends(get_db)):
    rules = db.query(AlertRule).all()
    if not rules:
        default_rules = [
            {
                "name": "Thermal & Fire Spike Directive",
                "description": "Natural Language Directive: 'Alert when fire or smoke mentions double in two weeks'",
                "rule_type": "Velocity Spike",
                "configuration": {"window_days": 14, "keyword": "fire"}
            },
            {
                "name": "Physical Harm & Injury Threshold",
                "description": "Natural Language Directive: 'Trigger critical priority alert if laceration or hospital visit reported'",
                "rule_type": "Severity Threshold",
                "configuration": {"min_severity": 3}
            },
            {
                "name": "Component Detachment & Fall Hazard",
                "description": "Natural Language Directive: 'Notify safety committee if strap or mount detachment occurs'",
                "rule_type": "Keyword Match",
                "configuration": {"phrase": "fell out"}
            }
        ]
        for r in default_rules:
            ar = AlertRule(
                name=r["name"],
                description=r["description"],
                rule_type=r["rule_type"],
                configuration=r["configuration"],
                enabled=True
            )
            db.add(ar)
        db.commit()
        rules = db.query(AlertRule).all()
    return rules

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
