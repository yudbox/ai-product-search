import { NextResponse } from "next/server";
import type { SearchRequest, SearchResponse, ParsedQuery } from "@/lib/types";
import { parseQueryWithLLM } from "@/lib/utils/queryParser";
import { normalizeQueryL1 } from "@/lib/utils/cacheHelpers";
import { trackQueryFrequency, CACHE_PREFIXES } from "@/lib/redis";
import {
  generateCacheKey,
  generateRejectionMessage,
  generateExplanation,
} from "@/lib/utils/searchHelpers";
import { getErrorResponse } from "@/lib/utils/errorHelpers";
import {
  checkL1Cache,
  checkL2Cache,
  saveToCache,
  buildCacheMetadata,
} from "@/lib/services/search/cache";
import {
  generateEmbedding,
  searchPinecone,
  transformToProducts,
} from "@/lib/services/search/pinecone";
import {
  logSearchRequest,
  logL1CacheCheck,
  logCacheHit,
  logCacheMiss,
  logParsedQuery,
  logPineconeFilter,
  logSearchResults,
  logCacheSave,
  logCacheError,
} from "@/lib/logger";

// Configuration validation
if (!process.env.OPENAI_EMBEDDING_MODEL) {
  throw new Error("OPENAI_EMBEDDING_MODEL is not configured");
}

if (!process.env.PINECONE_NAMESPACE) {
  throw new Error("PINECONE_NAMESPACE is not configured");
}

export async function POST(req: Request) {
  let query = "";
  try {
    const body: SearchRequest = await req.json();
    query = body.query;
    const { filters, excludedIds } = body;

    // Validate input
    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const startTotal = Date.now();
    logSearchRequest(query, filters);

    // L1 CACHE: Normalize query and check cache
    const startCache = Date.now();
    const normalizedQuery = normalizeQueryL1(query);
    const l1CacheKey = generateCacheKey(normalizedQuery, filters);

    logL1CacheCheck(query, normalizedQuery, l1CacheKey);

    const l1CacheResult = await checkL1Cache(l1CacheKey);

    let semanticQuery: string;
    let parsedQuery: ParsedQuery | null = null;

    if (l1CacheResult) {
      // L1 HIT
      semanticQuery = l1CacheResult;
      logCacheHit("L1", semanticQuery);
      await trackQueryFrequency(l1CacheKey);

      // L2 CACHE: Check full results
      const l2CacheResult = await checkL2Cache(semanticQuery, filters);

      if (l2CacheResult) {
        // L2 HIT: Return cached results
        logCacheHit("L2");
        const cacheTime = Date.now() - startCache;

        return NextResponse.json({
          success: true,
          query,
          count: l2CacheResult.count,
          products: l2CacheResult.products,
          explanation: l2CacheResult.explanation,
          cached: true,
          cacheMetadata: buildCacheMetadata(
            normalizedQuery,
            l1CacheKey,
            true,
            true,
          ),
          performance: {
            parsing: "0ms (cached)",
            embedding: "0ms (cached)",
            search: "0ms (cached)",
            cache: `${cacheTime}ms`,
            total: `${Date.now() - startTotal}ms`,
          },
        } satisfies SearchResponse);
      }

      logCacheMiss("L2");
    } else {
      logCacheMiss("L1");
    }

    // FULL SEARCH: Parse with LLM
    const startParsing = Date.now();
    parsedQuery = await parseQueryWithLLM(query);
    const parsingTime = Date.now() - startParsing;
    semanticQuery = parsedQuery.semanticQuery;

    logParsedQuery(parsedQuery);

    // TIER 1: Early rejection for non-footwear queries
    if (parsedQuery.isRelevant === false) {
      const helpMessage = generateRejectionMessage(
        parsedQuery.rejectionReason,
        parsedQuery.suggestedQuery,
        query,
      );

      return NextResponse.json({
        success: false,
        rejected: true,
        rejectionReason: parsedQuery.rejectionReason,
        query,
        count: 0,
        products: [],
        explanation: helpMessage,
        suggestedQuery: parsedQuery.suggestedQuery,
        performance: {
          parsing: `${parsingTime}ms`,
          embedding: "0ms",
          search: "0ms",
          total: `${Date.now() - startTotal}ms`,
        },
      });
    }

    // Generate embedding
    const startEmbedding = Date.now();
    const queryEmbedding = await generateEmbedding(parsedQuery.semanticQuery);
    const embeddingTime = Date.now() - startEmbedding;

    // Search Pinecone
    const startSearch = Date.now();
    const { searchResults, pineconeFilter } = await searchPinecone(
      queryEmbedding,
      parsedQuery,
      filters,
      excludedIds,
    );
    const searchTime = Date.now() - startSearch;

    logPineconeFilter(pineconeFilter ?? null);
    logSearchResults(searchResults.matches);

    // Transform results to Product objects
    const products = transformToProducts(searchResults.matches, excludedIds);

    // Generate AI explanation
    const explanation = generateExplanation(query, products, parsedQuery);

    const totalTime = Date.now() - startTotal;

    // Save to cache
    try {
      const { ttl, frequency } = await saveToCache(
        l1CacheKey,
        semanticQuery,
        products,
        explanation || "",
        parsedQuery,
        filters,
      );

      logCacheSave(
        `${CACHE_PREFIXES.L1}${l1CacheKey}`,
        `${CACHE_PREFIXES.L2}${generateCacheKey(semanticQuery, filters)}`,
        ttl,
        frequency,
      );

      return NextResponse.json({
        success: true,
        query,
        count: products.length,
        products,
        explanation,
        cached: false,
        cacheMetadata: buildCacheMetadata(
          normalizedQuery,
          l1CacheKey,
          false,
          false,
          ttl,
          frequency,
        ),
        suggestedQuery:
          products.length === 0 ? parsedQuery?.suggestedQuery : undefined,
        performance: {
          parsing: `${parsingTime}ms`,
          embedding: `${embeddingTime}ms`,
          search: `${searchTime}ms`,
          total: `${totalTime}ms`,
        },
      } satisfies SearchResponse);
    } catch (cacheError) {
      logCacheError(cacheError);

      // Return response even if cache save failed
      return NextResponse.json({
        success: true,
        query,
        count: products.length,
        products,
        explanation,
        cached: false,
        cacheMetadata: buildCacheMetadata(
          normalizedQuery,
          l1CacheKey,
          false,
          false,
        ),
        suggestedQuery:
          products.length === 0 ? parsedQuery?.suggestedQuery : undefined,
        performance: {
          parsing: `${parsingTime}ms`,
          embedding: `${embeddingTime}ms`,
          search: `${searchTime}ms`,
          total: `${totalTime}ms`,
        },
      } satisfies SearchResponse);
    }
  } catch (error: unknown) {
    console.error("❌ Search error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    if (errorStack) {
      console.error("Error stack:", errorStack);
    }

    // Get user-friendly error message based on error type
    const { userMessage, statusCode } = getErrorResponse(errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: userMessage,
        details: errorMessage,
        query,
        count: 0,
        products: [],
      },
      { status: statusCode },
    );
  }
}
