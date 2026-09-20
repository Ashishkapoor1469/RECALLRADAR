from typing import List, Dict, Any
from collections import defaultdict

CLUSTER_CATEGORIES = {
    "CHARGER OVERHEATING": ["hot", "overheat", "burning plastic", "melted", "warm block"],
    "FIRE & SMOKE HAZARD": ["fire", "smoke", "flames", "sparks", "caught fire"],
    "ELECTRICAL SHOCK": ["shock", "sparked", "electric shock", "short circuit"],
    "CHOKING HAZARD": ["choked", "choking", "swallowed", "button eye", "small part"],
    "FALL & STRAP FAILURE": ["strap", "buckle", "snapped", "harness", "fell"],
    "SHARP EDGE & LACERATION": ["cut", "blade", "sharp", "glass", "laceration"]
}

class DefectClusterer:
    """Clusters safety signals into high-level defect categories."""

    def cluster_signals(self, signals: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        clusters = defaultdict(list)

        for sig in signals:
            phrase = sig.get("phrase", "").lower()
            sig_type = sig.get("signal_type", "").lower()
            assigned = False

            for cluster_name, keywords in CLUSTER_CATEGORIES.items():
                if any(k in phrase or k in sig_type for k in keywords):
                    clusters[cluster_name].append(sig)
                    assigned = True
                    break

            if not assigned:
                clusters["GENERAL SAFETY CONCERN"].append(sig)

        result = []
        for name, items in clusters.items():
            result.append({
                "cluster_name": name,
                "count": len(items),
                "max_severity": max(i.get("severity", 1) for i in items),
                "signals": items
            })
        return sorted(result, key=lambda x: x["count"], reverse=True)
