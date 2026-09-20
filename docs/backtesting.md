# RecallRadar — Backtesting & Alert Budget Methodology

RecallRadar includes an operational Backtest Lab designed to measure historical early warning lead time and evaluate alert budget tradeoffs.

## 1. Zero Temporal Leakage Principle

All historical evaluations filter records strictly by `timestamp <= evaluation_date`. Future reviews or recall announcements are excluded during historical feature extraction.

## 2. Operational Alert Budget Slider

The Backtest Lab provides an interactive Alert Budget slider (1 to 100 alerts / 1,000 products).

- **Lower Budget (e.g. 5 alerts/1k)**: Higher precision (90%+), fewer false alarms (0.9/1k), but shorter lead time (~6.5 weeks).
- **Higher Budget (e.g. 50 alerts/1k)**: Longer lead time (~8.0 weeks), higher recall (90%+), but higher false alarm rate (9.0/1k).

## 3. Unseen-Category Evaluation

Evaluates generalizability by training feature weights on categories A, B, C (e.g., Electronics, Toys, Baby Products) and testing zero-shot performance on unseen category D (e.g., Sports Equipment).
