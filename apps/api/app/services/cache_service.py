import json
import logging
import time
from typing import Any, Optional
from app.core.config import Settings

logger = logging.getLogger(__name__)

# In-memory fallback cache: key -> (expiry_timestamp, serialized_json)
_memory_cache: dict[str, tuple[float, str]] = {}

_redis_client = None
_redis_initialized = False

def get_redis_client():
    global _redis_client, _redis_initialized
    if _redis_initialized:
        return _redis_client
    
    _redis_initialized = True
    settings = Settings()
    redis_url = settings.REDIS_URL or os.environ.get("REDIS_URL")
    
    # If not explicitly configured via REDIS_URL, check if REDIS_HOST was explicitly passed
    if not redis_url:
        if os.environ.get("REDIS_HOST") or os.environ.get("REDIS_PORT"):
            redis_url = settings.sync_redis_url
        else:
            # Redis not configured in environment - use in-memory cache instantly with 0ms overhead
            logger.info("REDIS_URL not configured. Operating in high-performance in-memory cache mode.")
            return None

    try:
        import redis
        client = redis.from_url(redis_url, socket_timeout=2.0, socket_connect_timeout=1.5)
        client.ping()
        _redis_client = client
        logger.info("Successfully connected to Redis at %s", redis_url)
    except Exception as e:
        logger.warning("Redis connection failed (%s), falling back to high-performance in-memory cache.", str(e))
        _redis_client = None

    return _redis_client

class CacheService:
    @staticmethod
    def get(key: str) -> Optional[Any]:
        """
        Get value from Redis or in-memory fallback cache.
        Returns parsed object or None if missing/expired.
        """
        # 1. Try Redis first if available
        client = get_redis_client()
        if client is not None:
            try:
                raw = client.get(key)
                if raw is not None:
                    return json.loads(raw if isinstance(raw, str) else raw.decode('utf-8'))
            except Exception as e:
                logger.warning("Redis GET error on key '%s': %s (falling back to memory)", key, e)

        # 2. Check in-memory cache fallback
        cached = _memory_cache.get(key)
        if cached is not None:
            expiry, data_str = cached
            if time.time() < expiry:
                try:
                    return json.loads(data_str)
                except Exception:
                    return None
            else:
                _memory_cache.pop(key, None)

        return None

    @staticmethod
    def set(key: str, value: Any, ttl_seconds: int = 30) -> None:
        """
        Save value to Redis and in-memory cache with specified TTL in seconds.
        """
        try:
            serialized = json.dumps(value, default=str)
        except Exception as e:
            logger.error("JSON serialization failed for cache key '%s': %s", key, e)
            return

        # 1. Save to in-memory cache
        _memory_cache[key] = (time.time() + ttl_seconds, serialized)

        # 2. Save to Redis if available
        client = get_redis_client()
        if client is not None:
            try:
                client.setex(key, ttl_seconds, serialized)
            except Exception as e:
                logger.warning("Redis SETEX error on key '%s': %s", key, e)

    @staticmethod
    def invalidate(prefix_or_key: str) -> None:
        """
        Invalidate keys matching prefix or exact key in both caches.
        """
        # Invalidate in-memory
        to_del = [k for k in _memory_cache if k == prefix_or_key or k.startswith(prefix_or_key)]
        for k in to_del:
            _memory_cache.pop(k, None)

        # Invalidate in Redis
        client = get_redis_client()
        if client is not None:
            try:
                # If exact key
                client.delete(prefix_or_key)
                # If pattern
                if "*" not in prefix_or_key:
                    keys = client.keys(f"{prefix_or_key}*")
                    if keys:
                        client.delete(*keys)
            except Exception as e:
                logger.warning("Redis invalidate error on '%s': %s", prefix_or_key, e)

    @staticmethod
    def clear_all() -> None:
        """Clear entire cache."""
        _memory_cache.clear()
        client = get_redis_client()
        if client is not None:
            try:
                client.flushdb()
            except Exception as e:
                logger.warning("Redis flush error: %s", e)
