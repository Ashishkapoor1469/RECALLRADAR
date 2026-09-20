# RecallRadar — Machine Learning & Detection Methodology

RecallRadar uses a multi-layered hybrid architecture combining rule-based safety lexicons, regex phrase patterns, vector embeddings, interpretable risk scoring, and survival analysis.

## 1. Multi-Layer Safety Signal Detector

- **Layer 1 (Lexicon)**: Deterministic matching across 8 safety categories (`fire`, `burn`, `smoke`, `overheat`, `electric shock`, `choking`, `fall`, `injury`).
- **Layer 2 (Regex Patterns)**: Key phrase extraction (`started smoking`, `burned my hand`, `gave me a shock`, `child almost choked`).
- **Layer 3 (Contextual Disambiguation)**: Filters out false positives like "burnt toast in the kitchen" or "shocking price".
- **Layer 4 (Severity Classification)**: Assigns severity scores from 0 (normal) to 4 (injury/fire).
- **Layer 5 (Temporal Aggregation)**: Computes 14-day velocity growth and acceleration ratios.

## 2. Interpretable Risk Engine (0-100)

Risk scores are normalized between 0 and 100 with explicit additive score factor breakdowns:

$$\text{Risk Score} = \min\left(30 \cdot S_{\text{vol}} + 25 \cdot S_{\text{sev}} + 25 \cdot S_{\text{vel}} + 10 \cdot S_{\text{agree}} + 10 \cdot S_{\text{unique}}, 100\right)$$

Contributors are presented clearly in the UI (e.g. `+31 Increasing burn reports`, `+18 Rapid signal growth`).

## 3. Lifelines Survival Analysis

`lifelines` (Kaplan-Meier and Cox Proportional Hazards) fits time-to-event duration models on historical review trajectories to estimate median weeks until recall.
