/**
 * Unit tests for Search Logger
 */

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
} from "../logger";
import type { ParsedQuery, SearchFilters } from "@/lib/types";
import { Gender } from "@/lib/types";

describe("logger", () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe("logSearchRequest", () => {
    it("should log search request with query only", () => {
      logSearchRequest("running shoes");

      expect(consoleLogSpy).toHaveBeenCalledWith("\n🎯 NEW SEARCH REQUEST:");
      expect(consoleLogSpy).toHaveBeenCalledWith("  Query:", "running shoes");
      expect(consoleLogSpy).toHaveBeenCalledWith("  UI Filters:", undefined);
    });

    it("should log search request with filters", () => {
      const filters: SearchFilters = {
        brands: ["Nike", "Adidas"],
        priceRange: ["0-100"],
      };

      logSearchRequest("running shoes", filters);

      expect(consoleLogSpy).toHaveBeenCalledWith("\n🎯 NEW SEARCH REQUEST:");
      expect(consoleLogSpy).toHaveBeenCalledWith("  Query:", "running shoes");
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "  UI Filters:",
        JSON.stringify(filters, null, 2),
      );
    });

    it("should log search request with empty filters", () => {
      logSearchRequest("shoes", {});

      expect(consoleLogSpy).toHaveBeenCalledWith("  UI Filters:", "{}");
    });
  });

  describe("logL1CacheCheck", () => {
    it("should log L1 cache check details", () => {
      logL1CacheCheck(
        "Nike running shoes",
        "nike running shoes",
        "l1:nike_running_shoes",
      );

      expect(consoleLogSpy).toHaveBeenCalledWith("\n🔑 L1 CACHE CHECK:");
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "  Original query:",
        "Nike running shoes",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "  Normalized query:",
        "nike running shoes",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "  Cache key:",
        "l1:nike_running_shoes",
      );
    });

    it("should handle empty strings", () => {
      logL1CacheCheck("", "", "");

      expect(consoleLogSpy).toHaveBeenCalledWith("  Original query:", "");
      expect(consoleLogSpy).toHaveBeenCalledWith("  Normalized query:", "");
      expect(consoleLogSpy).toHaveBeenCalledWith("  Cache key:", "");
    });
  });

  describe("logCacheHit", () => {
    it("should log L1 cache hit with semantic query", () => {
      logCacheHit("L1", "running shoes for athletics");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "  ✅ L1 HIT: semanticQuery =",
        "running shoes for athletics",
      );
    });

    it("should log L1 cache hit without semantic query", () => {
      logCacheHit("L1");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "  ✅ L1 HIT: semanticQuery =",
        undefined,
      );
    });

    it("should log L2 cache hit with cost savings", () => {
      logCacheHit("L2");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "  ✅ L2 HIT: Returning cached results",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "  💰 Saved: LLM ($0.0001) + Embedding ($0.000004) + Pinecone ($0.0001) = $0.0002",
      );
    });
  });

  describe("logCacheMiss", () => {
    it("should log L1 cache miss", () => {
      logCacheMiss("L1");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "  ❌ L1 MISS: Need to parse with LLM",
      );
    });

    it("should log L2 cache miss", () => {
      logCacheMiss("L2");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "  ❌ L2 MISS: Need to run full search",
      );
    });
  });

  describe("logParsedQuery", () => {
    it("should log complete parsed query with all fields", () => {
      const parsedQuery: ParsedQuery = {
        semanticQuery: "running shoes",
        originalQuery: "nike running shoes under $100",
        gender: Gender.Men,
        category: "Sneakers",
        brand: "Nike",
        color: "black",
        minPrice: 0,
        maxPrice: 100,
      };

      logParsedQuery(parsedQuery);

      expect(consoleLogSpy).toHaveBeenCalledWith("\n🔍 LLM PARSED QUERY:");
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "  semanticQuery:",
        "running shoes",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith("  gender:", Gender.Men);
      expect(consoleLogSpy).toHaveBeenCalledWith("  category:", "Sneakers");
      expect(consoleLogSpy).toHaveBeenCalledWith("  brand:", "Nike");
      expect(consoleLogSpy).toHaveBeenCalledWith("  color:", "black");
      expect(consoleLogSpy).toHaveBeenCalledWith("  minPrice:", 0);
      expect(consoleLogSpy).toHaveBeenCalledWith("  maxPrice:", 100);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "  Full parsed:",
        JSON.stringify(parsedQuery, null, 2),
      );
    });

    it("should log parsed query with minimal fields", () => {
      const parsedQuery: ParsedQuery = {
        semanticQuery: "shoes",
        originalQuery: "shoes",
      };

      logParsedQuery(parsedQuery);

      expect(consoleLogSpy).toHaveBeenCalledWith("  semanticQuery:", "shoes");
      expect(consoleLogSpy).toHaveBeenCalledWith("  gender:", "(not set)");
      expect(consoleLogSpy).toHaveBeenCalledWith("  category:", "(not set)");
      expect(consoleLogSpy).toHaveBeenCalledWith("  brand:", "(not set)");
      expect(consoleLogSpy).toHaveBeenCalledWith("  color:", "(not set)");
      expect(consoleLogSpy).toHaveBeenCalledWith("  minPrice:", "(not set)");
      expect(consoleLogSpy).toHaveBeenCalledWith("  maxPrice:", "(not set)");
    });

    it("should handle zero prices", () => {
      const parsedQuery: ParsedQuery = {
        semanticQuery: "shoes",
        originalQuery: "shoes",
        minPrice: 0,
        maxPrice: 0,
      };

      logParsedQuery(parsedQuery);

      expect(consoleLogSpy).toHaveBeenCalledWith("  minPrice:", 0);
      expect(consoleLogSpy).toHaveBeenCalledWith("  maxPrice:", 0);
    });
  });

  describe("logPineconeFilter", () => {
    it("should log Pinecone filter with all fields", () => {
      const filter = {
        gender: Gender.Women,
        price: { $gte: 50, $lte: 200 },
        brand: "Nike",
        category: "Running",
        color: "red",
      };

      logPineconeFilter(filter);

      expect(consoleLogSpy).toHaveBeenCalledWith("\n📊 PINECONE FILTER:");
      expect(consoleLogSpy).toHaveBeenCalledWith("  gender:", Gender.Women);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "  price:",
        JSON.stringify(filter.price),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith("  brand:", "Nike");
      expect(consoleLogSpy).toHaveBeenCalledWith("  category:", "Running");
      expect(consoleLogSpy).toHaveBeenCalledWith("  color:", "red");
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "  Full filter:",
        JSON.stringify(filter, null, 2),
      );
    });

    it("should log empty filter", () => {
      logPineconeFilter({});

      expect(consoleLogSpy).toHaveBeenCalledWith("\n📊 PINECONE FILTER:");
      expect(consoleLogSpy).toHaveBeenCalledWith("  gender:", "(not applied)");
      expect(consoleLogSpy).toHaveBeenCalledWith("  price:", "(not applied)");
      expect(consoleLogSpy).toHaveBeenCalledWith("  brand:", "(not applied)");
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "  category:",
        "(not applied)",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith("  color:", "(not applied)");
    });

    it("should log null filter", () => {
      logPineconeFilter(null);

      expect(consoleLogSpy).toHaveBeenCalledWith("\n📊 PINECONE FILTER:");
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "  No filters applied - searching all products",
      );
    });
  });

  describe("logSearchResults", () => {
    it("should log search results with matches", () => {
      const matches = [
        {
          metadata: {
            name: "Nike Air Max",
            price: 120,
            gender: Gender.Men,
            category: "Running",
          },
          score: 0.95,
        },
        {
          metadata: {
            name: "Adidas Ultra Boost",
            price: 180,
            gender: Gender.Women,
            category: "Running",
          },
          score: 0.92,
        },
        {
          metadata: {
            name: "Puma RS-X",
            price: 100,
            gender: Gender.Unisex,
            category: "Sneakers",
          },
          score: 0.88,
        },
      ];

      logSearchResults(matches);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "\n🔎 PINECONE SEARCH RESULTS: 3 matches found",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "  Price range:",
        100,
        "-",
        180,
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "  First 5 products:",
        expect.arrayContaining([
          expect.objectContaining({ name: "Nike Air Max", price: 120 }),
          expect.objectContaining({ name: "Adidas Ultra Boost", price: 180 }),
          expect.objectContaining({ name: "Puma RS-X", price: 100 }),
        ]),
      );
    });

    it("should handle empty results", () => {
      logSearchResults([]);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "\n🔎 PINECONE SEARCH RESULTS: 0 matches found",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "  ⚠️ No matches found - filter might be too restrictive!",
      );
    });

    it("should handle matches without metadata", () => {
      const matches = [{ score: 0.9 }, { score: 0.85 }];

      logSearchResults(matches);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "\n🔎 PINECONE SEARCH RESULTS: 2 matches found",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "  Price range:",
        "N/A",
        "-",
        "N/A",
      );
    });

    it("should handle matches without prices", () => {
      const matches = [
        { metadata: { name: "Product 1" }, score: 0.9 },
        { metadata: { name: "Product 2" }, score: 0.85 },
      ];

      logSearchResults(matches);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "  Price range:",
        "N/A",
        "-",
        "N/A",
      );
    });

    it("should limit displayed products to first 5", () => {
      const matches = Array.from({ length: 10 }, (_, i) => ({
        metadata: {
          name: `Product ${i + 1}`,
          price: 100 + i * 10,
        },
        score: 0.9 - i * 0.05,
      }));

      logSearchResults(matches);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "  First 5 products:",
        expect.arrayContaining([
          expect.objectContaining({ name: "Product 1" }),
          expect.objectContaining({ name: "Product 2" }),
          expect.objectContaining({ name: "Product 3" }),
          expect.objectContaining({ name: "Product 4" }),
          expect.objectContaining({ name: "Product 5" }),
        ]),
      );

      // Should NOT include Product 6
      const firstProductsCall = consoleLogSpy.mock.calls.find(
        (call) => call[0] === "  First 5 products:",
      );
      expect(firstProductsCall?.[1]).toHaveLength(5);
    });

    it("should format scores to 3 decimal places", () => {
      const matches = [
        {
          metadata: { name: "Product", price: 100 },
          score: 0.956789,
        },
      ];

      logSearchResults(matches);

      const firstProductsCall = consoleLogSpy.mock.calls.find(
        (call) => call[0] === "  First 5 products:",
      );
      expect(firstProductsCall?.[1][0].score).toBe("0.957");
    });
  });

  describe("logCacheSave", () => {
    it("should log cache save with all details", () => {
      logCacheSave("l1:test_key", "l2:semantic_key", 3600, 5);

      expect(consoleLogSpy).toHaveBeenCalledWith("\n💾 CACHE SAVED:");
      expect(consoleLogSpy).toHaveBeenCalledWith("  L1 key:", "l1:test_key");
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "  L2 key:",
        "l2:semantic_key",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith("  TTL:", "3600s (60min)");
      expect(consoleLogSpy).toHaveBeenCalledWith("  Frequency:", 5);
    });

    it("should handle short TTL", () => {
      logCacheSave("l1:test", "l2:test", 1800, 1);

      expect(consoleLogSpy).toHaveBeenCalledWith("  TTL:", "1800s (30min)");
    });

    it("should handle zero frequency", () => {
      logCacheSave("l1:test", "l2:test", 3600, 0);

      expect(consoleLogSpy).toHaveBeenCalledWith("  Frequency:", 0);
    });

    it("should handle long TTL", () => {
      logCacheSave("l1:test", "l2:test", 7200, 10);

      expect(consoleLogSpy).toHaveBeenCalledWith("  TTL:", "7200s (120min)");
    });
  });

  describe("logCacheError", () => {
    it("should log error with Error object", () => {
      const error = new Error("Cache connection failed");

      logCacheError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "❌ Cache save error:",
        error,
      );
    });

    it("should log error with string", () => {
      logCacheError("Connection timeout");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "❌ Cache save error:",
        "Connection timeout",
      );
    });

    it("should log error with unknown type", () => {
      const error = { code: 500, message: "Internal error" };

      logCacheError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "❌ Cache save error:",
        error,
      );
    });

    it("should handle null error", () => {
      logCacheError(null);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "❌ Cache save error:",
        null,
      );
    });

    it("should handle undefined error", () => {
      logCacheError(undefined);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "❌ Cache save error:",
        undefined,
      );
    });
  });
});
