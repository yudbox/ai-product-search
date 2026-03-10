/**
 * Redis Client Factory with Dependency Injection
 * Automatically selects between Docker Redis (dev) and Vercel KV (production)
 * Provides caching utilities: Adaptive TTL, frequency tracking, statistics
 */

import type { IRedisClient } from "./client";
import { DockerRedisClient } from "./dockerRedisClient";
import { VercelKvClient } from "./vercelKvClient";

/**
 * Factory: Create Redis client based on environment
 * Dependency Injection pattern for clean architecture
 * Graceful degradation: handles Redis connection errors
 */
function createRedisClient(): IRedisClient {
  try {
    const isProduction =
      process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
    const hasVercelKV = !!process.env.KV_REST_API_URL;
    const shouldUseVercelKV = isProduction || hasVercelKV;

    console.log(
      "🔌 Redis Backend:",
      shouldUseVercelKV ? "Vercel KV" : "Docker Redis",
    );

    if (shouldUseVercelKV) {
      return new VercelKvClient();
    } else {
      return new DockerRedisClient();
    }
  } catch (error) {
    console.warn(
      "⚠️ Failed to create Redis client:",
      error instanceof Error ? error.message : error,
    );
    console.warn(
      "⚠️ App will continue WITHOUT caching. All requests will go through Pinecone.",
    );
    // Return a no-op client that does nothing but doesn't throw errors
    return createNoOpRedisClient();
  }
}

/**
 * No-op Redis client for graceful degradation when Redis is unavailable
 * All methods return safe default values
 */
function createNoOpRedisClient(): IRedisClient {
  console.warn("🚨 Using No-Op Redis Client (Redis unavailable)");
  return {
    async get() {
      return null;
    },
    async set() {
      // No-op
    },
    async zincrby() {
      return 0;
    },
    async zscore() {
      return null;
    },
    async zrange() {
      return [];
    },
    async zcard() {
      return 0;
    },
  };
}

// Singleton instance (Dependency Injection)
export const redis: IRedisClient = createRedisClient();

// ============================================
// Cache Configuration
// ============================================

/**
 * Cache key prefixes for namespace isolation
 */
export const CACHE_PREFIXES = {
  L1: "l1:", // L1 cache: normalized text → semanticQuery
  L2: "l2:", // L2 cache: semanticQuery → full search results
  FREQUENCY: "freq:", // Query frequency tracking (Sorted Set)
} as const;

/**
 * Cache TTL strategies based on query frequency (Adaptive TTL)
 * Production approach: hot queries get longer TTL to reduce costs
 */
export const TTL_STRATEGY = {
  HOT: 2 * 60 * 60, // 2 hours (5+ hits/day)
  WARM: 1 * 60 * 60, // 1 hour (2-4 hits/day)
  COLD: 30 * 60, // 30 minutes (1 hit/day)
} as const;

/**
 * Frequency thresholds for Adaptive TTL
 * Based on daily hit counts tracked in Redis Sorted Set
 */
export const FREQUENCY_THRESHOLDS = {
  HOT: 5, // 5+ hits/day
  WARM: 2, // 2-4 hits/day
  // Below WARM = COLD (1 hit/day)
} as const;

// ============================================
// Cache Utilities (Business Logic)
// ============================================

/**
 * Get dynamic TTL based on query frequency
 * Uses Redis Sorted Set to track query popularity
 * Graceful degradation: returns default TTL if Redis unavailable
 */
export async function getAdaptiveTTL(cacheKey: string): Promise<number> {
  try {
    // Get hit count from frequency tracker (score in Sorted Set)
    const frequencyKey = `${CACHE_PREFIXES.FREQUENCY}queries`;
    const hitCount = await redis.zscore(frequencyKey, cacheKey);

    if (!hitCount || hitCount < FREQUENCY_THRESHOLDS.WARM) {
      return TTL_STRATEGY.COLD; // 30min for rare queries
    }

    if (hitCount >= FREQUENCY_THRESHOLDS.HOT) {
      return TTL_STRATEGY.HOT; // 2h for popular queries
    }

    return TTL_STRATEGY.WARM; // 1h for moderate queries
  } catch (error) {
    console.warn(
      "⚠️ Adaptive TTL calculation failed (Redis unavailable):",
      error instanceof Error ? error.message : error,
    );
    return TTL_STRATEGY.COLD; // Fallback to shortest TTL (30min)
  }
}

/**
 * Track query frequency for Adaptive TTL
 * Increments score in Redis Sorted Set
 * Graceful degradation: silently fails if Redis unavailable
 */
export async function trackQueryFrequency(cacheKey: string): Promise<void> {
  try {
    const frequencyKey = `${CACHE_PREFIXES.FREQUENCY}queries`;
    await redis.zincrby(frequencyKey, 1, cacheKey);
  } catch (error) {
    console.warn(
      "⚠️ Query frequency tracking failed (Redis unavailable):",
      error instanceof Error ? error.message : error,
    );
    // Non-critical error - app continues without frequency tracking
  }
}
