from typing import Dict, Any, List

class InterpretableRiskEngine:
    """Transparent risk scoring model producing 0-100 score and explicit factor breakdowns."""

    def calculate_risk(self, features: Dict[str, Any]) -> Dict[str, Any]:
        signal_count = features.get("signal_count", 0)
        recent_count = features.get("recent_count", 0)
        velocity_ratio = features.get("velocity_ratio", 1.0)
        max_severity = features.get("max_severity", 0)
        source_agreement = features.get("source_agreement", 0.0)
        unique_reporters = features.get("unique_reporters", 0)

        contributors: List[Dict[str, Any]] = []
        raw_score = 0.0

        # 1. Base Signal Volume Contribution (up to 30 pts)
        sig_pts = min(signal_count * 5.0, 30.0)
        if sig_pts > 0:
            contributors.append({
                "factor": "Safety signal occurrences",
                "points": round(sig_pts, 1),
                "description": f"+{int(sig_pts):02d} {signal_count} total safety signal mentions"
            })
            raw_score += sig_pts

        # 2. Severity Contribution (up to 25 pts)
        sev_pts = max_severity * 6.25
        if sev_pts > 0:
            contributors.append({
                "factor": "Maximum severity level",
                "points": round(sev_pts, 1),
                "description": f"+{int(sev_pts):02d} Severity level {max_severity} hazard detected"
            })
            raw_score += sev_pts

        # 3. Recent Velocity & Acceleration (up to 25 pts)
        if velocity_ratio > 1.2:
            vel_pts = min((velocity_ratio - 1.0) * 12.5, 25.0)
            contributors.append({
                "factor": "Rapid signal growth",
                "points": round(vel_pts, 1),
                "description": f"+{int(vel_pts):02d} {recent_count} recent mentions ({round(velocity_ratio, 1)}x velocity)"
            })
            raw_score += vel_pts

        # 4. Source Agreement (up to 10 pts)
        if source_agreement > 0:
            sa_pts = 10.0
            contributors.append({
                "factor": "Cross-source agreement",
                "points": sa_pts,
                "description": "+10 Confirmed across reviews and SaferProducts.gov"
            })
            raw_score += sa_pts

        # 5. Independent Reporter Diversity (up to 10 pts)
        if unique_reporters > 1:
            rep_pts = min(unique_reporters * 2.5, 10.0)
            contributors.append({
                "factor": "Multiple independent reviewers",
                "points": round(rep_pts, 1),
                "description": f"+{int(rep_pts):02d} {unique_reporters} distinct independent reporters"
            })
            raw_score += rep_pts

        normalized_score = min(max(round(raw_score, 1), 0.0), 100.0)

        # Confidence Calculation
        conf_score = min((unique_reporters * 0.15) + (source_agreement * 0.3) + 0.3, 1.0)
        if conf_score >= 0.75:
            conf_label = "High"
        elif conf_score >= 0.45:
            conf_label = "Medium"
        else:
            conf_label = "Low"

        return {
            "product_id": features.get("product_id"),
            "risk_score": normalized_score,
            "confidence_score": round(conf_score, 2),
            "confidence_label": conf_label,
            "contributors": contributors,
            "signal_count": signal_count,
            "max_severity": max_severity
        }
