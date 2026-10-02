from typing import List, Dict, Any, Optional
from collections import defaultdict
import math

class ImprovementClusterer:
    """
    Clusters detected improvement suggestions by semantic topic
    and calculates the Improvement Index (0-100) based on consensus density.
    """

    def cluster_suggestions(self, suggestions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Groups raw improvement suggestions into semantic clusters,
        deduplicating review IDs per cluster so that one review only counts once
        towards any single cluster.
        """
        clusters_map = defaultdict(lambda: {
            "cluster_label": "",
            "category": "",
            "review_ids": set(),
            "suggestions": [],
            "samples": []
        })

        for s in suggestions:
            label = s.get("cluster_label", "General Design Refinements")
            rev_id = s.get("review_id")
            cat = s.get("category", "General Usability")

            cluster = clusters_map[label]
            cluster["cluster_label"] = label
            cluster["category"] = cat
            if rev_id:
                cluster["review_ids"].add(rev_id)
            cluster["suggestions"].append(s.get("suggestion_text", ""))
            
            # Store up to 3 representative sample excerpts
            sample_text = s.get("full_review_excerpt") or s.get("suggestion_text")
            if sample_text and len(cluster["samples"]) < 3 and sample_text not in cluster["samples"]:
                cluster["samples"].append(sample_text)

        # Convert to list and calculate metrics
        results = []
        for label, data in clusters_map.items():
            count = len(data["review_ids"]) if data["review_ids"] else len(data["suggestions"])
            results.append({
                "cluster_label": label,
                "category": data["category"],
                "count": count,
                "sample_quotes": data["samples"],
                "representative_suggestion": data["suggestions"][0] if data["suggestions"] else label
            })

        # Sort by cluster frequency descending
        results.sort(key=lambda x: x["count"], reverse=True)
        return results

    def calculate_improvement_index(
        self,
        clusters: List[Dict[str, Any]],
        total_improvement_reviews: int
    ) -> float:
        """
        Calculates an Improvement Index (0-100) based on customer consensus.
        Multiple customers asking for the same enhancement (e.g. wire length)
        drive the consensus score up.
        """
        if not clusters or total_improvement_reviews <= 0:
            return 0.0

        top_cluster_count = clusters[0]["count"] if clusters else 0
        distinct_clusters = len(clusters)

        # 1. Primary consensus score: how many customers agree on the top issue
        # 1 user: 18 pts, 2 users: 36 pts, 3 users: 54 pts, 4 users: 68 pts, 5+ users: 78 pts
        consensus_score = min(78.0, top_cluster_count * 17.5)

        # 2. Breadth of secondary suggestions across distinct product areas
        breadth_score = min(15.0, max(0, distinct_clusters - 1) * 4.0)

        # 3. Total improvement volume density boost
        volume_boost = min(12.0, math.log2(1 + total_improvement_reviews) * 3.5)

        # Composite Improvement Index bounded 0 to 98.0
        final_index = round(min(98.0, consensus_score + breadth_score + volume_boost), 1)
        return max(0.0, final_index)
