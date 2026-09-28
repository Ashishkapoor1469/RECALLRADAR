import sys
import os

# Set PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "api")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from apps.api.tests.test_db_models import test_models_import_and_instantiation
from apps.api.tests.test_synthetic_generator import test_synthetic_dataset_generation
from apps.api.tests.test_adapters import test_cpsc_adapter_normalization, test_amazon_adapter_normalization, test_support_tickets_adapter_normalization
from apps.api.tests.test_safety_detector import test_safety_detector_phrases, test_safety_language_false_positives
from apps.api.tests.test_critical_scenario import test_critical_charger_lead_time_scenario
from apps.api.tests.test_temporal_leakage import test_temporal_leakage_prevention
from apps.api.tests.test_false_alarms import test_false_alarm_non_safety_reviews
from apps.api.tests.test_grounding import test_explanation_grounding_and_fallback
from apps.api.tests.test_api_endpoints import test_health_endpoint, test_root_endpoint, test_ask_endpoint_hallucination_refusal
from apps.api.tests.test_spike_detection import test_real_spike_fires, test_flat_trend_does_not_fire, test_low_volume_noise_does_not_fire
from apps.api.tests.test_webhook_alert import test_webhook_alert_unset_skips_silently, test_webhook_alert_failure_fails_soft
from apps.api.tests.test_audit_log import test_audit_log_direct_entry, test_audit_log_on_rule_creation, test_audit_log_on_csv_export
from apps.api.tests.test_changes_endpoint import (
    test_system_changes_endpoint_schema,
    test_system_changes_cache_performance,
    test_system_changes_updates_token_on_new_data,
    test_system_changes_db_unreachable_returns_503,
)

def main():
    tests = [
        ("Database Models Instantiation", test_models_import_and_instantiation),
        ("Synthetic Dataset Generation", test_synthetic_dataset_generation),
        ("CPSC Data Adapter Normalization", test_cpsc_adapter_normalization),
        ("Amazon Reviews Adapter Normalization", test_amazon_adapter_normalization),
        ("Support Tickets Adapter Normalization", test_support_tickets_adapter_normalization),
        ("Multi-Layer Safety Signal Detector", test_safety_detector_phrases),

        ("Contextual Safety Disambiguation", test_safety_language_false_positives),
        ("Demo Smart Charger Critical Scenario Lead Time", test_critical_charger_lead_time_scenario),
        ("Zero Temporal Leakage Prevention", test_temporal_leakage_prevention),
        ("False Alarm Non-Safety Review Filtering", test_false_alarm_non_safety_reviews),
        ("NIM Grounded Citation & Offline Fallback", test_explanation_grounding_and_fallback),
        ("FastAPI Health Endpoint", test_health_endpoint),
        ("FastAPI Root Endpoint", test_root_endpoint),
        ("Ask RecallRadar Hallucination Refusal", test_ask_endpoint_hallucination_refusal),
        ("Spike Detection Alert: Real Spike Fires", test_real_spike_fires),
        ("Spike Detection Alert: Flat Trend Does Not Fire", test_flat_trend_does_not_fire),
        ("Spike Detection Alert: Low-Volume Noise Filter", test_low_volume_noise_does_not_fire),
        ("Webhook Alert Channel: Unset Skips Silently", test_webhook_alert_unset_skips_silently),
        ("Webhook Alert Channel: Network Failure Fails Soft", test_webhook_alert_failure_fails_soft),
        ("Audit Log: Direct Entry Creation", test_audit_log_direct_entry),
        ("Audit Log: Append on Rule Creation", test_audit_log_on_rule_creation),
        ("Audit Log: Append on CSV Data Export", test_audit_log_on_csv_export),
        ("System Changes: Schema & Tokens", test_system_changes_endpoint_schema),
        ("System Changes: In-Memory Cache Performance", test_system_changes_cache_performance),
        ("System Changes: Reactivity on Data Insert", test_system_changes_updates_token_on_new_data),
        ("System Changes: Fail-Safe 503 on DB Error", test_system_changes_db_unreachable_returns_503)
    ]


    passed = 0
    failed = 0

    print("=" * 60)
    print("RECALLRADAR AUTOMATED SUITE TEST RUNNER")
    print("=" * 60)

    for name, test_func in tests:
        try:
            test_func()
            print(f"[PASS] {name}")
            passed += 1
        except Exception as e:
            print(f"[FAIL] {name}: {type(e).__name__} - {repr(e)}")
            failed += 1

    print("=" * 60)
    print(f"Total Tests Run: {len(tests)} | Passed: {passed} | Failed: {failed}")
    print("=" * 60)

    if failed > 0:
        sys.exit(1)
    else:
        print("ALL BACKEND TESTS PASSED CLEANLY!")

if __name__ == "__main__":
    main()
