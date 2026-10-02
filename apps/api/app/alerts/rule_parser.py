import re
from typing import Dict, Any, List

class NaturalLanguageRuleParser:
    """Parses natural language alert directives into validated JSON rule specifications."""

    def parse(self, text: str) -> Dict[str, Any]:
        text_lower = text.lower()
        signals: List[str] = []
        
        for word in ["burn", "fire", "smoke", "overheat", "shock", "chok", "fall", "cut"]:
            if word in text_lower:
                signals.append(word)

        if not signals:
            signals = ["hazard"]

        # Check if directive targets Improvement Index
        if "improvement" in text_lower:
            # Parse threshold
            threshold_match = re.search(r"(?:crosses|exceeds|above|>|>=|\bto\b|\bat\b)?\s*(\d{2,3}(?:\.\d+)?)", text_lower)
            threshold_val = float(threshold_match.group(1)) if threshold_match else 60.0

            # Parse window
            window_days = 21
            if "3 weeks" in text_lower or "three weeks" in text_lower or "21 days" in text_lower:
                window_days = 21
            elif "2 weeks" in text_lower or "two weeks" in text_lower or "14 days" in text_lower:
                window_days = 14
            elif "1 week" in text_lower or "one week" in text_lower or "7 days" in text_lower:
                window_days = 7
            elif "30 days" in text_lower or "month" in text_lower:
                window_days = 30

            return {
                "name": f"Improvement Rule: {text[:40]}...",
                "raw_text": text,
                "rule_type": "Improvement Surge",
                "configuration": {
                    "metric": "improvement_index",
                    "threshold": threshold_val,
                    "window_days": window_days,
                    "comparison": "greater_than"
                },
                "enabled": True
            }

        # Parse threshold or multiplier
        multiplier = 2.0
        if "double" in text_lower or "2x" in text_lower:
            multiplier = 2.0
        elif "triple" in text_lower or "3x" in text_lower:
            multiplier = 3.0

        # Parse window
        window_days = 14
        if "two weeks" in text_lower or "2 weeks" in text_lower or "14 days" in text_lower:
            window_days = 14
        elif "three weeks" in text_lower or "3 weeks" in text_lower or "21 days" in text_lower:
            window_days = 21
        elif "one week" in text_lower or "1 week" in text_lower or "7 days" in text_lower:
            window_days = 7
        elif "30 days" in text_lower or "month" in text_lower:
            window_days = 30

        rule_spec = {
            "name": f"Custom Rule: {text[:40]}...",
            "raw_text": text,
            "rule_type": "RATE_INCREASE",
            "configuration": {
                "signals": signals,
                "operator": "OR",
                "metric": "mention_rate",
                "comparison": "increase_ratio",
                "threshold_multiplier": multiplier,
                "window_days": window_days
            },
            "enabled": True
        }
        return rule_spec
