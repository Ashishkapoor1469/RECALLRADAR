import sys
import os

# Set PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "api")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from apps.api.tests.test_db_models import test_models_import_and_instantiation
from apps.api.tests.test_synthetic_generator import test_synthetic_dataset_generation
from apps.api.tests.test_adapters import test_cpsc_adapter_normalization, test_amazon_adapter_normalization
from apps.api.tests.test_safety_detector import test_safety_detector_phrases, test_safety_language_false_positives
from apps.api.tests.test_critical_scenario import test_critical_charger_lead_time_scenario
from apps.api.tests.test_temporal_leakage import test_temporal_leakage_prevention
from apps.api.tests.test_false_alarms import test_false_alarm_non_safety_reviews
from apps.api.tests.test_grounding import test_explanation_grounding_and_fallback
from apps.api.tests.test_api_endpoints import test_health_endpoint, test_root_endpoint, test_ask_endpoint_hallucination_refusal

def main():
    tests = [
        ("Database Models Instantiation", test_models_import_and_instantiation),
        ("Synthetic Dataset Generation", test_synthetic_dataset_generation),
        ("CPSC Data Adapter Normalization", test_cpsc_adapter_normalization),
        ("Amazon Reviews Adapter Normalization", test_amazon_adapter_normalization),
        ("Multi-Layer Safety Signal Detector", test_safety_detector_phrases),
        ("Contextual Safety Disambiguation", test_safety_language_false_positives),
        ("Demo Smart Charger Critical Scenario Lead Time", test_critical_charger_lead_time_scenario),
        ("Zero Temporal Leakage Prevention", test_temporal_leakage_prevention),
        ("False Alarm Non-Safety Review Filtering", test_false_alarm_non_safety_reviews),
        ("NIM Grounded Citation & Offline Fallback", test_explanation_grounding_and_fallback),
        ("FastAPI Health Endpoint", test_health_endpoint),
        ("FastAPI Root Endpoint", test_root_endpoint),
        ("Ask RecallRadar Hallucination Refusal", test_ask_endpoint_hallucination_refusal)
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
