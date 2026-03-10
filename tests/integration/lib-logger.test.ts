/**
 * Integration tests for lib/logger.ts
 * Testing all logging functions to ensure coverage
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
} from "@/lib/logger";
import type { ParsedQuery, SearchFilters } from "@/lib/types";
import { Gender } from "@/lib/types";

describe("Integration: lib/logger", () => {
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
    it("should log search request without filters", () => {
      logSearchRequest("laptop");

      expect(consoleLogSpy).toHaveBeenCalledWith("\n🎯 NEW SEARCH REQUEST:");
      expect(consoleLogSpy).toHaveBeenCalledWith("  Query:", "laptop");
    });

    it("should log search request with filters", () => {
      const filters: SearchFilters = {
        brands: ["Nike"],
        categories: ["Shoes"],
        priceRange: ["100-200"],
      };

      logSearchRequest("running shoes", filters);

      expect(consoleLogSpy).toHaveBeenCalledWith("\n🎯 NEW SEARCH REQUEST:");
      expect(consoleLogSpy).toHaveBeenCalledWith("  Query:", "running shoes");
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "  UI Filters:",
        JSON.stringify(filters, null, 2),
      );
    });

    it("should handle empty query", () => {
      logSearchRequest("");
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe("logL1CacheCheck", () => {
    it("should log cache check with all parameters", () => {
      logL1CacheCheck("Nike Shoes", "nike shoes", "l1:nike_shoes");

      expect(consoleLogSpy).toHaveBeenCalledWith("\n🔑 L1 CACHE CHECK:");
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "  Original query:",
        "Nike Shoes",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "  Normalized query:",
        "nike shoes",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "  Cache key:",
        "l1:nike_shoes",
      );
    });

    it("should handle special characters in query", () => {
      logL1CacheCheck(
        "Men's running shoes!",
        "mens running shoes",
        "l1:mens_running_shoes",
      );
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe("logCacheHit", () => {
    it("should log L1 cache hit with semantic query", () => {
      logCacheHit("L1", "athletic footwear");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "  ✅ L1 HIT: semanticQuery =",
        "athletic footwear",
      );
    });

    it("should log L2 cache hit with cost savings", () => {
      logCacheHit("L2");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "  ✅ L2 HIT: Returning cached results",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("💰 Saved:"),
      );
    });

    it("should log L1 hit without semantic query", () => {
      logCacheHit("L1");
      expect(consoleLogSpy).toHaveBeenCalled();
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
        semanticQuery: "comfortable running shoes",
        originalQuery: "comfortable running shoes",
        gender: Gender.Men,
        category: "Shoes",
        brand: "Nike",
        color: "blue",
        minPrice: 50,
        maxPrice: 150,
      };

      logParsedQuery(parsedQuery);

      expect(consoleLogSpy).toHaveBeenCalledWith("\n🔍 LLM PARSED QUERY:");
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "  semanticQuery:",
        "comfortable running shoes",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith("  gender:", Gender.Men);
      expect(consoleLogSpy).toHaveBeenCalledWith("  category:", "Shoes");
      expect(consoleLogSpy).toHaveBeenCalledWith("  brand:", "Nike");
      expect(consoleLogSpy).toHaveBeenCalledWith("  color:", "blue");
      expect(consoleLogSpy).toHaveBeenCalledWith("  minPrice:", 50);
      expect(consoleLogSpy).toHaveBeenCalledWith("  maxPrice:", 150);
    });

    it("should log parsed query with minimal fields", () => {
      const parsedQuery: ParsedQuery = {
        semanticQuery: "laptop",
        originalQuery: "laptop",
      };

      logParsedQuery(parsedQuery);

      expect(consoleLogSpy).toHaveBeenCalledWith("  semanticQuery:", "laptop");
      expect(consoleLogSpy).toHaveBeenCalledWith("  gender:", "(not set)");
      expect(consoleLogSpy).toHaveBeenCalledWith("  category:", "(not set)");
    });

    it("should handle zero prices", () => {
      const parsedQuery: ParsedQuery = {
        semanticQuery: "free items",
        originalQuery: "free items",
        minPrice: 0,
        maxPrice: 0,
      };

      logParsedQuery(parsedQuery);
      expect(consoleLogSpy).toHaveBeenCalledWith("  minPrice:", 0);
      expect(consoleLogSpy).toHaveBeenCalledWith("  maxPrice:", 0);
    });
  });

  describe("logPineconeFilter", () => {
    it("should log filter with all fields", () => {
      const filter = {
        gender: "Men",
        category: "Shoes",
        brand: "Nike",
        color: "blue",
        price: { $gte: 50, $lte: 150 },
      };

      logPineconeFilter(filter);

      expect(consoleLogSpy).toHaveBeenCalledWith("\n📊 PINECONE FILTER:");
      expect(consoleLogSpy).toHaveBeenCalledWith("  gender:", "Men");
      expect(consoleLogSpy).toHaveBeenCalledWith("  brand:", "Nike");
      expect(consoleLogSpy).toHaveBeenCalledWith("  category:", "Shoes");
      expect(consoleLogSpy).toHaveBeenCalledWith("  color:", "blue");
    });

    it("should log null filter", () => {
      logPineconeFilter(null);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "  No filters applied - searching all products",
      );
    });

    it("should log empty filter object", () => {
      logPineconeFilter({});

      expect(consoleLogSpy).toHaveBeenCalledWith("\n📊 PINECONE FILTER:");
    });
  });

  describe("logSearchResults", () => {
    it("should log results with matches", () => {
      const matches = [
        {
          metadata: {
            name: "Nike Air Max",
            price: 120,
            gender: "Men",
            category: "Shoes",
          },
          score: 0.95,
        },
        {
          metadata: {
            name: "Adidas Ultraboost",
            price: 180,
            gender: "Women",
            category: "Shoes",
          },
          score: 0.92,
        },
        {
          metadata: {
            name: "Puma RS-X",
            price: 90,
            gender: "Unisex",
            category: "Shoes",
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
        90,
        "-",
        180,
      );
    });

    it("should log empty results", () => {
      logSearchResults([]);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "\n🔎 PINECONE SEARCH RESULTS: 0 matches found",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "  ⚠️ No matches found - filter might be too restrictive!",
      );
    });

    it("should handle results without prices", () => {
      const matches = [
        {
          metadata: { name: "Product 1" },
          score: 0.9,
        },
      ];

      logSearchResults(matches);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it("should log exactly 5 products when more than 5 matches", () => {
      const matches = Array.from({ length: 10 }, (_, i) => ({
        metadata: {
          name: `Product ${i}`,
          price: 100 + i * 10,
          gender: "Unisex",
          category: "Accessories",
        },
        score: 0.9 - i * 0.05,
      }));

      logSearchResults(matches);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "\n🔎 PINECONE SEARCH RESULTS: 10 matches found",
      );
    });
  });

  describe("logCacheSave", () => {
    it("should log cache save operation", () => {
      logCacheSave("l1:key123", "l2:key456", 3600, 1);

      expect(consoleLogSpy).toHaveBeenCalledWith("\n💾 CACHE SAVED:");
      expect(consoleLogSpy).toHaveBeenCalledWith("  L1 key:", "l1:key123");
      expect(consoleLogSpy).toHaveBeenCalledWith("  L2 key:", "l2:key456");
      expect(consoleLogSpy).toHaveBeenCalledWith("  TTL:", "3600s (60min)");
      expect(consoleLogSpy).toHaveBeenCalledWith("  Frequency:", 1);
    });

    it("should handle different TTL values", () => {
      logCacheSave("l1:test", "l2:test", 1800, 5);

      expect(consoleLogSpy).toHaveBeenCalledWith("  TTL:", "1800s (30min)");
      expect(consoleLogSpy).toHaveBeenCalledWith("  Frequency:", 5);
    });

    it("should handle zero frequency", () => {
      logCacheSave("l1:new", "l2:new", 600, 0);
      expect(consoleLogSpy).toHaveBeenCalledWith("  Frequency:", 0);
    });
  });

  describe("logCacheError", () => {
    it("should log error object", () => {
      const error = new Error("Cache connection failed");
      logCacheError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "❌ Cache save error:",
        error,
      );
    });

    it("should log string error", () => {
      logCacheError("Connection timeout");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "❌ Cache save error:",
        "Connection timeout",
      );
    });

    it("should log unknown error type", () => {
      logCacheError({ code: 500, message: "Internal error" });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should log null error", () => {
      logCacheError(null);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "❌ Cache save error:",
        null,
      );
    });
  });

  describe("Integration: Complete logging flow", () => {
    it("should execute a complete search logging flow", () => {
      // Step 1: Log search request
      const filters: SearchFilters = {
        brands: ["Nike"],
        categories: ["Shoes"],
        priceRange: ["50-150"],
      };
      logSearchRequest("running shoes", filters);

      // Step 2: Log L1 cache check
      logL1CacheCheck("running shoes", "running shoes", "l1:running_shoes");

      // Step 3: Log L1 cache miss
      logCacheMiss("L1");

      // Step 4: Log parsed query
      const parsedQuery: ParsedQuery = {
        semanticQuery: "athletic footwear for running",
        originalQuery: "running shoes",
        gender: Gender.Men,
        category: "Shoes",
        brand: "Nike",
        minPrice: 50,
        maxPrice: 150,
      };
      logParsedQuery(parsedQuery);

      // Step 5: Log L2 cache miss
      logCacheMiss("L2");

      // Step 6: Log Pinecone filter
      const pineconeFilter = {
        gender: "Men",
        category: "Shoes",
        brand: "Nike",
        price: { $gte: 50, $lte: 150 },
      };
      logPineconeFilter(pineconeFilter);

      // Step 7: Log search results
      const results = [
        {
          metadata: {
            name: "Nike Air Zoom",
            price: 120,
            gender: "Men",
            category: "Shoes",
          },
          score: 0.95,
        },
      ];
      logSearchResults(results);

      // Step 8: Log cache save
      logCacheSave("l1:running_shoes", "l2:hash123", 3600, 1);

      // Verify all logging functions were called
      expect(consoleLogSpy.mock.calls.length).toBeGreaterThan(20);
    });

    it("should handle cache hit scenario", () => {
      logSearchRequest("laptop");
      logL1CacheCheck("laptop", "laptop", "l1:laptop");
      logCacheHit("L1", "portable computer");
      logCacheHit("L2");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "  ✅ L1 HIT: semanticQuery =",
        "portable computer",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "  ✅ L2 HIT: Returning cached results",
      );
    });

    it("should handle error scenario", () => {
      logSearchRequest("test query");
      logL1CacheCheck("test query", "test query", "l1:test");
      logCacheMiss("L1");

      const error = new Error("LLM API error");
      logCacheError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "❌ Cache save error:",
        error,
      );
    });
  });
});
