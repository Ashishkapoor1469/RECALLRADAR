# RecallRadar — Database Schema & Data Model Documentation

RecallRadar uses a normalized PostgreSQL relational schema extended with `pgvector` for 384-dimensional vector embeddings.

## Entity Relationship Summary

```text
+--------------+        +--------------+        +------------------+
|   Product    |<------|    Review    |<------|   SafetySignal   |
+--------------+        +--------------+        +------------------+
  ^          ^                                            |
  |          +----------+                                 |
  |                     |                                 v
+--------------+  +--------------+              +------------------+
| SafetyReport |  |    Recall    |              |  AlertEvidence   |
+--------------+  +--------------+              +--------+---------+
  ^                                                      |
  |                                                      v
  +-------------------------------------------------+  +-------+
                                                    |  | Alert |
                                                    |  +-------+
```

## Tables Reference

- `products`: Product catalog entity (`id`, `external_id`, `name`, `brand`, `category`, `subcategory`, `description`, `created_at`, `updated_at`).
- `reviews`: Customer review corpus (`id`, `product_id`, `external_id`, `rating`, `title`, `body`, `review_date`, `verified`, `source`, `embedding Vector(384)`).
- `safety_reports`: Public incident safety reports from SaferProducts.gov (`id`, `product_id`, `external_id`, `report_date`, `description`, `severity`, `source`, `embedding Vector(384)`).
- `recalls`: Official CPSC recall announcements (`id`, `product_id`, `recall_date`, `hazard`, `remedy`, `category`, `source`).
- `safety_signals`: Detected safety occurrences (`id`, `product_id`, `review_id`, `report_id`, `signal_type`, `phrase`, `severity`, `confidence`, `detected_at`).
- `product_risk_snapshots`: Historical risk score evaluations (`id`, `product_id`, `snapshot_date`, `risk_score`, `confidence`, `contributors JSON`).
- `alerts`: Active/resolved alerts (`id`, `product_id`, `alert_type`, `threshold`, `risk_score`, `confidence`, `status`, `explanation JSON`).
- `alert_evidence`: Links alerts to specific reviews/reports (`id`, `alert_id`, `review_id`, `report_id`, `evidence_text`, `danger_phrase`).
- `alert_rules`: User-created natural language & manual rules (`id`, `name`, `rule_type`, `configuration JSON`, `enabled`).
- `backtest_runs`: Historical backtest runs (`id`, `name`, `alert_budget`, `configuration JSON`).
- `backtest_results`: Evaluated historical recall lead times (`id`, `run_id`, `product_id`, `recall_date`, `first_alert_date`, `lead_time_weeks`, `false_alarm`).
