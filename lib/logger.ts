/**
 * Search Logger - Structured logging for search operations
 * Provides consistent, readable logging throughout the search flow
 */

import type { ParsedQuery, SearchRequest } from "@/lib/types";

/**
 * Log new search request
 */
export function logSearchRequest(
  query: string,
  filters?: SearchRequest["filters"],
) {
  console.log("\n🎯 NEW SEARCH REQUEST:");
  console.log("  Query:", query);
  console.log("  UI Filters:", JSON.stringify(filters, null, 2));
}

/**
 * Log L1 cache check
 */
export function logL1CacheCheck(
  originalQuery: string,
  normalizedQuery: string,
  cacheKey: string,
) {
  console.log("\n🔑 L1 CACHE CHECK:");
  console.log("  Original query:", originalQuery);
  console.log("  Normalized query:", normalizedQuery);
  console.log("  Cache key:", cacheKey);
}

/**
 * Log cache hit (L1 or L2)
 */
export function logCacheHit(level: "L1" | "L2", semanticQuery?: string) {
  if (level === "L1") {
    console.log(`  ✅ L1 HIT: semanticQuery =`, semanticQuery);
  } else {
    console.log("  ✅ L2 HIT: Returning cached results");
    console.log(
      `  💰 Saved: LLM ($0.0001) + Embedding ($0.000004) + Pinecone ($0.0001) = $0.0002`,
    );
  }
}

/**
 * Log cache miss
 */
export function logCacheMiss(level: "L1" | "L2") {
  if (level === "L1") {
    console.log("  ❌ L1 MISS: Need to parse with LLM");
  } else {
    console.log("  ❌ L2 MISS: Need to run full search");
  }
}

/**
 * Log LLM parsed query
 */
export function logParsedQuery(parsedQuery: ParsedQuery) {
  console.log("\n🔍 LLM PARSED QUERY:");
  console.log("  semanticQuery:", parsedQuery.semanticQuery);
  console.log("  gender:", parsedQuery.gender || "(not set)");
  console.log("  category:", parsedQuery.category || "(not set)");
  console.log("  brand:", parsedQuery.brand || "(not set)");
  console.log("  color:", parsedQuery.color || "(not set)");
  console.log(
    "  minPrice:",
    parsedQuery.minPrice !== undefined ? parsedQuery.minPrice : "(not set)",
  );
  console.log(
    "  maxPrice:",
    parsedQuery.maxPrice !== undefined ? parsedQuery.maxPrice : "(not set)",
  );
  console.log("  Full parsed:", JSON.stringify(parsedQuery, null, 2));
}

/**
 * Log Pinecone filter
 */
export function logPineconeFilter(
  pineconeFilter: Record<string, unknown> | null,
) {
  console.log("\n📊 PINECONE FILTER:");
  if (pineconeFilter) {
    console.log(
      "  gender:",
      (pineconeFilter.gender as string) || "(not applied)",
    );
    console.log(
      "  price:",
      pineconeFilter.price
        ? JSON.stringify(pineconeFilter.price)
        : "(not applied)",
    );
    console.log(
      "  brand:",
      (pineconeFilter.brand as string) || "(not applied)",
    );
    console.log(
      "  category:",
      (pineconeFilter.category as string) || "(not applied)",
    );
    console.log(
      "  color:",
      (pineconeFilter.color as string) || "(not applied)",
    );
    console.log("  Full filter:", JSON.stringify(pineconeFilter, null, 2));
  } else {
    console.log("  No filters applied - searching all products");
  }
}

/**
 * Log Pinecone search results
 */
export function logSearchResults(
  matches: Array<{ metadata?: Record<string, unknown>; score?: number }>,
) {
  console.log(`\n🔎 PINECONE SEARCH RESULTS: ${matches.length} matches found`);

  if (matches.length > 0) {
    const prices = matches
      .map((m) => m.metadata?.price)
      .filter((p): p is number => typeof p === "number");

    console.log(
      "  Price range:",
      prices.length > 0 ? Math.min(...prices) : "N/A",
      "-",
      prices.length > 0 ? Math.max(...prices) : "N/A",
    );

    console.log(
      "  First 5 products:",
      matches.slice(0, 5).map((m) => ({
        name: m.metadata?.name,
        price: m.metadata?.price,
        gender: m.metadata?.gender,
        category: m.metadata?.category,
        score: m.score?.toFixed(3),
      })),
    );
  } else {
    console.log("  ⚠️ No matches found - filter might be too restrictive!");
  }
}

/**
 * Log cache save operation
 */
export function logCacheSave(
  l1Key: string,
  l2Key: string,
  ttl: number,
  frequency: number,
) {
  console.log("\n💾 CACHE SAVED:");
  console.log("  L1 key:", l1Key);
  console.log("  L2 key:", l2Key);
  console.log("  TTL:", `${ttl}s (${ttl / 60}min)`);
  console.log("  Frequency:", frequency);
}

/**
 * Log cache save error (non-critical)
 */
export function logCacheError(error: unknown) {
  console.error("❌ Cache save error:", error);
}
