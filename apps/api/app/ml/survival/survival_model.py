import pandas as pd
from typing import Dict, Any, Optional

class RecallSurvivalAnalyzer:
    """Estimates time-to-event recall hazards using lifelines."""

    def __init__(self):
        self.kmf = None
        try:
            from lifelines import KaplanMeierFitter
            self.kmf = KaplanMeierFitter()
        except Exception as e:
            print(f"Lifelines load note: {e}. Using empirical fallback estimator.")

    def fit_and_estimate(self, historical_df: pd.DataFrame) -> Dict[str, Any]:
        """Fits survival model on historical duration and event data."""
        if historical_df.empty or "duration" not in historical_df.columns:
            return {
                "median_weeks_to_recall": 8.0,
                "hazard_rate": 0.12,
                "model_fitted": False
            }

        if self.kmf is not None and len(historical_df) >= 3:
            try:
                durations = historical_df["duration"]
                events = historical_df.get("event", [1] * len(durations))
                self.kmf.fit(durations, event_observed=events)
                median_dur = self.kmf.median_survival_time_
                return {
                    "median_weeks_to_recall": float(median_dur) if pd.notnull(median_dur) else 8.0,
                    "hazard_rate": round(1.0 / max(float(median_dur or 8.0), 1.0), 3),
                    "model_fitted": True
                }
            except Exception:
                pass

        avg_dur = float(historical_df["duration"].mean()) if not historical_df.empty else 8.0
        return {
            "median_weeks_to_recall": round(avg_dur, 1),
            "hazard_rate": round(1.0 / max(avg_dur, 1.0), 3),
            "model_fitted": False
        }
