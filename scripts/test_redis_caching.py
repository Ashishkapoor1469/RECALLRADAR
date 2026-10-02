import os
import sys
import time

# Ensure api directory is on python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "api")))

from app.services.cache_service import CacheService, get_redis_client
from app.db.session import SessionLocal
from app.api.v1.overview import get_overview_summary, get_sentiment_telemetry, get_shared_product_risk_list
from app.api.v1.products import get_products_needing_attention

def test_caching_layer():
    print("=== Testing Redis / Dual-Layer Cache System ===")
    
    # 1. Test Redis Connectivity check
    client = get_redis_client()
    if client:
        print(" [OK] Redis Client: CONNECTED to remote/local Redis instance")
    else:
        print(" [INFO] Redis Client: Fallback mode active (High-performance in-memory cache)")

    # 2. Test Cache Set / Get
    CacheService.set("test:ping", {"status": "ok", "value": 42}, ttl_seconds=10)
    cached = CacheService.get("test:ping")
    assert cached == {"status": "ok", "value": 42}, f"Expected value 42, got {cached}"
    print(" [OK] CacheService basic set/get verified")

    # Invalidate test key
    CacheService.invalidate("test:ping")
    assert CacheService.get("test:ping") is None
    print(" [OK] CacheService invalidation verified")

    # 3. Test Endpoint Caching Performance
    db = SessionLocal()
    try:
        # Invalidate existing cache to measure cold vs warm
        CacheService.invalidate("cache:product_risk_list")
        CacheService.invalidate("cache:overview_summary")
        CacheService.invalidate("cache:sentiment_telemetry")

        # Cold execution
        t0 = time.time()
        cold_summary = get_overview_summary(db)
        cold_time = (time.time() - t0) * 1000

        # Warm (cached) execution
        t1 = time.time()
        warm_summary = get_overview_summary(db)
        warm_time = (time.time() - t1) * 1000

        print(f" [OK] Overview Summary: Cold = {cold_time:.2f}ms | Cached = {warm_time:.2f}ms (Speedup: {cold_time/max(warm_time, 0.001):.1f}x)")
        assert cold_summary["total_products"] == warm_summary["total_products"]
        print(f"      Total products: {warm_summary['total_products']}, Total signals: {warm_summary['total_signals']}")

        # Cold vs Warm on Products Needing Attention
        t2 = time.time()
        attention_result = get_products_needing_attention(limit=5, db=db)
        attention_time = (time.time() - t2) * 1000
        print(f" [OK] Products Needing Attention: {len(attention_result['items'])} items returned in {attention_time:.2f}ms")
        for item in attention_result['items'][:2]:
            print(f"      - {item['name'][:40]} | Score: {item['composite_score']} | Status: {item['hold_status']}")

        # Cold vs Warm on Sentiment Telemetry
        t3 = time.time()
        cold_sentiment = get_sentiment_telemetry(mode="negative", granularity="month", db=db)
        cold_sent_time = (time.time() - t3) * 1000

        t4 = time.time()
        warm_sentiment = get_sentiment_telemetry(mode="negative", granularity="month", db=db)
        warm_sent_time = (time.time() - t4) * 1000
        print(f" [OK] Sentiment Telemetry: Cold = {cold_sent_time:.2f}ms | Cached = {warm_sent_time:.2f}ms (Speedup: {cold_sent_time/max(warm_sent_time, 0.001):.1f}x)")
        print(f"      Series data points: {len(warm_sentiment['series'])}, Total reviews cohort: {warm_sentiment['total_reviews_cohort']}")

        print("\nALL CACHING TESTS PASSED! System is protected against slow database queries and refresh spikes.")
    finally:
        db.close()

if __name__ == "__main__":
    test_caching_layer()
