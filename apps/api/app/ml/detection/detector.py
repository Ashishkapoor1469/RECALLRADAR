import re
from typing import List, Dict, Any, Optional
from app.ml.detection.context import is_false_positive_context

SAFETY_VOCABULARY = {
    "fire": ["caught fire", "fire hazard", "burst into flames", "flames"],
    "burn": ["burned my hand", "burned my skin", "smelled like burning", "burn hazard", "burning plastic", "melted"],
    "smoke": ["started smoking", "smoke coming", "smoke filled", "thick smoke"],
    "overheat": ["gets unusually hot", "extremely hot", "dangerously hot", "adapter overheated", "overheated"],
    "electric shock": ["gave me a shock", "electric shock", "sparked", "sparking cord", "shocked me"],
    "choking": ["child almost choked", "choking hazard", "swallowed hazard", "choked on"],
    "fall": ["strap snapped", "harness broke", "buckle failed", "fall injury", "fell out"],
    "injury": ["cut my finger", "sharp edge cut", "laceration", "hospital", "bleeding"]
}

SEVERITY_MAPPING = {
    "fire": 4,
    "burn": 3,
    "smoke": 3,
    "electric shock": 3,
    "injury": 4,
    "fall": 3,
    "choking": 4,
    "overheat": 2
}

class SafetySignalDetector:
    """Hybrid multi-layer safety signal detector."""

    def detect(self, text: str) -> List[Dict[str, Any]]:
        """Scans text for safety signals and returns structured detections."""
        if not text:
            return []

        text_lower = text.lower()
        detections = []

        for signal_type, phrases in SAFETY_VOCABULARY.items():
            for phrase in phrases:
                if phrase in text_lower:
                    # Context check
                    if is_false_positive_context(text_lower, signal_type):
                        continue

                    sev = SEVERITY_MAPPING.get(signal_type, 2)
                    # Upgrade severity for explicit injury/fire words
                    if "caught fire" in text_lower or "hospital" in text_lower or "burned" in text_lower:
                        sev = 4

                    detections.append({
                        "signal_type": signal_type,
                        "phrase": phrase,
                        "severity": sev,
                        "confidence": 0.95
                    })

        return detections
