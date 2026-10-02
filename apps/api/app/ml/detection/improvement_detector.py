import re
from typing import List, Dict, Any, Optional

# Pre-compiled suggestion patterns (structural linguistic markers of constructive feedback)
SUGGESTION_PATTERNS = [
    # Contrastive suggestion: "good/great/nice... but/however/wish..."
    (
        re.compile(
            r"(?:good|great|nice|decent|works?\s+(?:well|fine|great)|love|solid|excellent|fine|handy)\s*,?\s*(?:but|however|except|only\s+(?:issue|flaw|problem|gripe|catch|downside|drawback))\s*[:,\s-]*([^.!?\n]+)",
            re.IGNORECASE
        ),
        0.94
    ),
    # Wishful / Conditional suggestion: "wish it had...", "would be better if...", "could use..."
    (
        re.compile(
            r"(?:wish(?:ed)?\s+(?:it|they|there|this)\s+(?:had|were|would|could|included?|came\s+with))\s*[:,\s-]*([^.!?\n]+)",
            re.IGNORECASE
        ),
        0.96
    ),
    (
        re.compile(
            r"(?:would|could)\s+be\s+(?:much\s+|a\s+lot\s+)?(?:better|nicer|improved|great|handier|perfect)\s+if\s*[:,\s-]*([^.!?\n]+)",
            re.IGNORECASE
        ),
        0.96
    ),
    (
        re.compile(
            r"(?:if\s+only\s+(?:it|they|there)\s+(?:had|were|came|made))\s*[:,\s-]*([^.!?\n]+)",
            re.IGNORECASE
        ),
        0.92
    ),
    (
        re.compile(
            r"(?:could\s+use|needs?\s+(?:to\s+be\s+)?|needs?\s+a\s+)(?:a\s+little\s+|a\s+bit\s+)?([^.!?\n]+)",
            re.IGNORECASE
        ),
        0.90
    ),
    # Direct imperative / actionable modification: "make it longer/stronger", "hope they add..."
    (
        re.compile(
            r"(?:make\s+it\s+(?:a\s+little\s+|a\s+bit\s+)?(?:longer|shorter|bigger|smaller|stronger|sturdier|quieter|lighter|heavier|thicker|wider|softer|more\s+durable|more\s+flexible))",
            re.IGNORECASE
        ),
        0.98
    ),
    (
        re.compile(
            r"(?:hope\s+they\s+(?:add|fix|improve|release|update)|please\s+(?:add|make|include|provide)|should\s+(?:have\s+been|come\s+with|include|be\s+made))\s*[:,\s-]*([^.!?\n]+)",
            re.IGNORECASE
        ),
        0.93
    ),
    (
        re.compile(
            r"(?:room\s+for\s+improvement|minor\s+complaint|minor\s+gripe|would\s+prefer\s+if)\s*[:,\s-]*([^.!?\n]+)",
            re.IGNORECASE
        ),
        0.91
    ),
    # Dimension / usability constraint: "too short", "too stiff", "too tight", "too bulky"
    (
        re.compile(
            r"(?:wire|cable|cord|strap|hinge|screw|knob|button|case|fader|neck|handle)\s+(?:is\s+)?(?:a\s+bit\s+|too\s+)(?:short|tight|stiff|loose|heavy|bulky|quiet|bright|dim|faint|sensitive|small)",
            re.IGNORECASE
        ),
        0.95
    ),
    (
        re.compile(
            r"(?:too\s+short|too\s+tight|too\s+stiff|too\s+bulky|too\s+loose)\b",
            re.IGNORECASE
        ),
        0.88
    )
]

# Explicit safety/hazard markers that disqualify a review from being a mere "improvement suggestion"
HAZARD_DISQUALIFIERS = [
    "caught fire", "burst into flames", "burned my", "smoke filled", "emergency room",
    "electric shock", "hospital", "bleeding", "laceration", "choking hazard", "er doctor"
]

# Domain categories and canonical cluster mappings (specific to product design & ergonomics)
IMPROVEMENT_CLUSTERS = [
    {
        "cluster_label": "Extend Cable / Wire Length",
        "category": "Cable & Connectivity",
        "keywords": ["short", "longer cable", "longer wire", "longer cord", "reach", "wire length", "cable length", "short cord", "short wire", "cord length", "extend"]
    },
    {
        "cluster_label": "Cable Flexibility & Detachability",
        "category": "Cable & Connectivity",
        "keywords": ["detachable", "flexible cable", "stiff cable", "tangle", "right angle", "replaceable cord", "braided", "usb-c", "wireless"]
    },
    {
        "cluster_label": "Strap Comfort & Shoulder Padding",
        "category": "Ergonomics & Comfort",
        "keywords": ["strap", "padding", "shoulder", "cushion", "neck strain", "comfort", "softer", "ergonomic", "pinching"]
    },
    {
        "cluster_label": "Control Knobs & Tuning Smoothness",
        "category": "Controls & Interface",
        "keywords": ["knob", "dial", "fader", "potentiometer", "tuning peg", "switch", "button feel", "taper", "volume knob", "stiff knob"]
    },
    {
        "cluster_label": "Chassis & Latch Sturdiness",
        "category": "Build & Materials",
        "keywords": ["hinge", "latch", "plastic feel", "sturdier", "metal instead", "more solid", "durability", "screws", "housing", "looseness"]
    },
    {
        "cluster_label": "Hiss & Background Noise Reduction",
        "category": "Sound & Performance",
        "keywords": ["hiss", "hum", "noise floor", "background noise", "interference", "cleaner sound", "ground hum", "preamp noise"]
    },
    {
        "cluster_label": "Included Case & Accessory Bundle",
        "category": "Accessories & Packaging",
        "keywords": ["case", "pouch", "bag", "gig bag", "included adapter", "came with a case", "carrying case", "include picks", "accessories"]
    },
    {
        "cluster_label": "Battery Life & Indicator LED",
        "category": "Power & Usability",
        "keywords": ["battery life", "battery indicator", "led too bright", "dim led", "power switch", "rechargeable", "battery compartment"]
    },
    {
        "cluster_label": "Clearer Markings & User Manual",
        "category": "Usability & Documentation",
        "keywords": ["manual", "instructions", "markings", "font size", "labels", "documentation", "clearer guide", "diagram"]
    }
]


class ImprovementDetector:
    """
    Dedicated classifier & detector for product improvement suggestions.
    Identifies reviews that are positive/neutral overall (or constructive)
    and contain actionable product enhancement recommendations.
    """

    def detect(self, text: str, rating: Optional[float] = None) -> List[Dict[str, Any]]:
        """
        Scans text for improvement suggestion patterns, filters out hazard complaints,
        and assigns categorical & semantic cluster labels.
        """
        if not text or len(text.strip()) < 8:
            return []

        text_lower = text.lower()

        # Disqualify catastrophic hazard reports (handled exclusively by SafetySignalDetector)
        if any(h in text_lower for h in HAZARD_DISQUALIFIERS):
            return []

        # Constructive reviews typically have rating >= 2.0 (often 3, 4, 5 stars: "great product, but...")
        # A 1-star review is generally a pure complaint unless explicitly phrased as a feature request
        if rating is not None and rating < 2.0:
            if not any(k in text_lower for k in ["wish it had", "would be better if", "make it longer", "hope they add"]):
                return []

        detections = []
        matched_spans = set()

        for pattern, base_conf in SUGGESTION_PATTERNS:
            matches = pattern.finditer(text)
            for m in matches:
                # Capture the suggestion excerpt
                if m.groups() and m.group(1):
                    excerpt = m.group(1).strip()
                else:
                    excerpt = m.group(0).strip()

                # Clean excerpt
                excerpt = re.sub(r"^[,\s:-]+", "", excerpt).strip()
                if len(excerpt) < 4:
                    continue

                # Deduplicate overlapping spans
                span_key = (m.start() // 10) * 10
                if span_key in matched_spans:
                    continue
                matched_spans.add(span_key)

                # Classify into canonical cluster
                cluster_label = "General Design Refinements"
                category = "General Usability"
                matched_kw = None

                context_lower = (excerpt + " " + text_lower).lower()

                for cluster in IMPROVEMENT_CLUSTERS:
                    for kw in cluster["keywords"]:
                        if kw in context_lower:
                            cluster_label = cluster["cluster_label"]
                            category = cluster["category"]
                            matched_kw = kw
                            break
                    if matched_kw:
                        break

                # Boost confidence if specific suggestion keywords match
                conf = base_conf
                if matched_kw:
                    conf = min(conf + 0.03, 0.99)

                detections.append({
                    "suggestion_text": excerpt[:160],
                    "category": category,
                    "cluster_label": cluster_label,
                    "matched_keyword": matched_kw,
                    "confidence": round(conf, 2),
                    "full_review_excerpt": text[:280] + ("..." if len(text) > 280 else "")
                })

        return detections

    def is_improvement_review(self, text: str, rating: Optional[float] = None) -> bool:
        """Returns True if the review contains at least one improvement suggestion."""
        return len(self.detect(text, rating)) > 0
