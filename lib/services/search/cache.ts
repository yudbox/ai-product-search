/**
 * Cache Service - Redis cache operations
 * Handles L1/L2 cache check and save with Adaptive TTL
 */

import type {
  CacheMetadata,
  CachedSearchResult,
  SearchRequest,
  Product,
  ParsedQuery,
} from "@/lib/types";
import {
  redis,
  CACHE_PREFIXES,
  getAdaptiveTTL,
  trackQueryFrequency,
} from "@/lib/redis";
import { generateCacheKey } from "@/lib/utils/searchHelpers";

/**
 * Check L1 cache (normalized query → semanticQuery)
 * Graceful degradation: returns null if Redis unavailable
 */
export async function checkL1Cache(l1CacheKey: string): Promise<string | null> {
  try {
    return await redis.get<string>(`${CACHE_PREFIXES.L1}${l1CacheKey}`);
  } catch (error) {
    console.warn(
      "⚠️ L1 cache check failed (Redis unavailable):",
      error instanceof Error ? error.message : error,
    );
    return null; // Fallback: cache miss, proceed without cache
  }
}

/**
 * Check L2 cache (semanticQuery → full results)
 * Graceful degradation: returns null if Redis unavailable
 */
export async function checkL2Cache(
  semanticQuery: string,
  filters?: SearchRequest["filters"],
): Promise<CachedSearchResult | null> {
  try {
    const l2CacheKey = generateCacheKey(semanticQuery, filters);
    return await redis.get<CachedSearchResult>(
      `${CACHE_PREFIXES.L2}${l2CacheKey}`,
    );
  } catch (error) {
    console.warn(
      "⚠️ L2 cache check failed (Redis unavailable):",
      error instanceof Error ? error.message : error,
    );
    return null; // Fallback: cache miss, proceed without cache
  }
}

/**
 * Save search results to L1 + L2 cache with Adaptive TTL
 * Graceful degradation: returns default values if Redis unavailable
 */
export async function saveToCache(
  l1CacheKey: string,
  semanticQuery: string,
  products: Product[],
  explanation: string,
  parsedQuery: ParsedQuery,
  filters?: SearchRequest["filters"],
): Promise<{ ttl: number; frequency: number }> {
  try {
    // Get Adaptive TTL based on query frequency
    const ttl = await getAdaptiveTTL(l1CacheKey);

    // Save L1: normalized query → semanticQuery mapping
    await redis.set(`${CACHE_PREFIXES.L1}${l1CacheKey}`, semanticQuery, {
      ex: ttl,
    });

    // Save L2: semanticQuery → full search results
    const l2CacheKey = generateCacheKey(semanticQuery, filters);
    const cachedResult: CachedSearchResult = {
      products,
      explanation,
      count: products.length,
      parsedQuery,
      timestamp: Date.now(),
      filters,
    };

    await redis.set(`${CACHE_PREFIXES.L2}${l2CacheKey}`, cachedResult, {
      ex: ttl,
    });

    // Track frequency for Adaptive TTL
    await trackQueryFrequency(l1CacheKey);
    const frequency =
      (await redis.zscore(`${CACHE_PREFIXES.FREQUENCY}queries`, l1CacheKey)) ||
      1;

    return { ttl, frequency };
  } catch (error) {
    console.warn(
      "⚠️ Cache save failed (Redis unavailable):",
      error instanceof Error ? error.message : error,
    );
    // Fallback: return default TTL values, app continues without caching
    return { ttl: 1800, frequency: 0 }; // 30min default TTL
  }
}

/**
 * Build cache metadata for response
 */
export function buildCacheMetadata(
  normalizedQuery: string,
  l1CacheKey: string,
  l1Hit: boolean,
  l2Hit: boolean,
  ttl?: number,
  frequency?: number,
): CacheMetadata {
  return {
    normalizedQuery,
    cacheKey: l1CacheKey,
    l1Hit,
    l2Hit,
    ttl,
    frequency,
  };
}
