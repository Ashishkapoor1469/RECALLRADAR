import json
import httpx
from typing import Dict, Any, List, Optional
from app.core.config import settings

class ExplanationService:
    """Generates grounded alert explanations using NVIDIA NIM or deterministic fallback."""

    def generate_explanation(
        self,
        alert: Dict[str, Any],
        product: Dict[str, Any],
        evidence_items: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Produces structured grounded explanation JSON with evidence citation IDs."""

        # Try NVIDIA NIM if key configured
        if settings.NVIDIA_NIM_API_KEY:
            try:
                nim_response = self._query_nim(alert, product, evidence_items)
                if nim_response:
                    return nim_response
            except Exception as e:
                print(f"NVIDIA NIM query failed: {e}. Utilizing deterministic fallback.")

        # Deterministic fallback explanation generator
        return self._generate_fallback(alert, product, evidence_items)

    def _generate_fallback(
        self,
        alert: Dict[str, Any],
        product: Dict[str, Any],
        evidence_items: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        prod_name = product.get("name", "Monitored Product")
        risk = alert.get("risk_score", 70.0)
        
        evidence_list = []
        for i, ev in enumerate(evidence_items):
            ev_id = ev.get("id", f"R-{100 + i}")
            evidence_list.append({
                "id": ev_id,
                "claim": f"Observed safety complaint in review [{ev_id}]: {ev.get('evidence_text', '')}"
            })

        return {
            "summary": f"Alert triggered for {prod_name} due to elevated risk score ({risk}/100).",
            "observed_pattern": f"Cluster of safety signals detected for {prod_name} exceeding threshold.",
            "why_alerted": f"Risk score {risk} exceeded threshold 70.0.",
            "severity": alert.get("confidence", "Medium"),
            "evidence": evidence_list,
            "limitations": "Explanation generated using deterministic fallback model based strictly on ingested evidence.",
            "is_fallback": True
        }

    def _query_nim(
        self,
        alert: Dict[str, Any],
        product: Dict[str, Any],
        evidence_items: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        headers = {
            "Authorization": f"Bearer {settings.NVIDIA_NIM_API_KEY}",
            "Content-Type": "application/json"
        }

        prompt = f"""
You are explaining a safety monitoring alert for product {product.get('name')}.
Use ONLY the supplied evidence items below. Every factual claim MUST reference evidence IDs (e.g. [R-101]).
Do NOT invent facts. Return valid JSON with keys: summary, observed_pattern, why_alerted, severity, evidence, limitations.

Evidence items:
{json.dumps(evidence_items)}
"""

        payload = {
            "model": settings.NVIDIA_NIM_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1
        }

        url = f"{settings.NVIDIA_NIM_BASE_URL}/chat/completions"
        resp = httpx.post(url, headers=headers, json=payload, timeout=25.0)
        if resp.status_code == 200:
            content = resp.json()["choices"][0]["message"]["content"].strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            parsed = json.loads(content.strip())
            parsed["is_fallback"] = False
            return parsed
        return None
