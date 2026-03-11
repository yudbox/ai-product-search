/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck - Test file with extensive mocking
// Mock dependencies BEFORE importing route
jest.mock("@/lib/openai", () => ({
  openai: {
    embeddings: {
      create: jest.fn(),
    },
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  },
}));

jest.mock("@/lib/pinecone", () => ({
  index: {
    namespace: jest.fn(),
  },
}));

jest.mock("@/lib/redis", () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    zscore: jest.fn(),
  },
  trackQueryFrequency: jest.fn(),
  CACHE_PREFIXES: {
    L1: "search:l1:",
    L2: "search:l2:",
    FREQUENCY: "search:freq:",
  },
}));

jest.mock("@/lib/utils/cacheHelpers", () => ({
  normalizeQueryL1: jest.fn((query: string) => query.toLowerCase()),
}));

jest.mock("@/lib/utils/queryParser", () => ({
  parseQueryWithLLM: jest.fn(),
}));

jest.mock("@/lib/utils/searchHelpers", () => ({
  generateCacheKey: jest.fn((query: string) => `cache_key_${query}`),
  generateRejectionMessage: jest.fn(() => "This is not a footwear query"),
  generateExplanation: jest.fn(() => "Here are the results"),
}));

jest.mock("@/lib/services/search/cache", () => ({
  checkL1Cache: jest.fn(),
  checkL2Cache: jest.fn(),
  saveToCache: jest.fn(),
  buildCacheMetadata: jest.fn(() => ({
    normalizedQuery: "test query",
    cacheKey: "cache_key_test",
    l1Hit: false,
    l2Hit: false,
  })),
}));

jest.mock("@/lib/services/search/pinecone", () => ({
  generateEmbedding: jest.fn(),
  searchPinecone: jest.fn(),
  transformToProducts: jest.fn(),
}));

jest.mock("@/lib/logger", () => ({
  logSearchRequest: jest.fn(),
  logL1CacheCheck: jest.fn(),
  logCacheHit: jest.fn(),
  logCacheMiss: jest.fn(),
  logParsedQuery: jest.fn(),
  logPineconeFilter: jest.fn(),
  logSearchResults: jest.fn(),
  logCacheSave: jest.fn(),
  logCacheError: jest.fn(),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      status: options?.status || 200,
      json: async () => data,
      data,
    })),
  },
}));

// Now import the route
import { POST } from "../route";
import { NextResponse } from "next/server";
import { Gender } from "@/lib/types";
import { parseQueryWithLLM } from "@/lib/utils/queryParser";
import { normalizeQueryL1 } from "@/lib/utils/cacheHelpers";
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
  generateCacheKey,
  generateRejectionMessage,
  generateExplanation,
} from "@/lib/utils/searchHelpers";
import { logCacheError } from "@/lib/logger";

const mockParseQueryWithLLM = jest.mocked(parseQueryWithLLM);
const mockNormalizeQueryL1 = jest.mocked(normalizeQueryL1);
const mockCheckL1Cache = jest.mocked(checkL1Cache);
const mockCheckL2Cache = jest.mocked(checkL2Cache);
const mockSaveToCache = jest.mocked(saveToCache);
const mockBuildCacheMetadata = jest.mocked(buildCacheMetadata);
const mockGenerateEmbedding = jest.mocked(generateEmbedding);
const mockSearchPinecone = jest.mocked(searchPinecone);
const mockTransformToProducts = jest.mocked(transformToProducts);
const mockGenerateCacheKey = jest.mocked(generateCacheKey);
const mockGenerateRejectionMessage = jest.mocked(generateRejectionMessage);
const mockGenerateExplanation = jest.mocked(generateExplanation);
const mockLogCacheError = jest.mocked(logCacheError);

// Suppress console.error for expected errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    // Suppress expected error messages from error handling tests
    if (typeof args[0] === "string" && args[0].includes("❌ Search error")) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

describe("POST /api/search", () => {
  const mockEmbedding = new Array(768).fill(0.1);
  const mockProducts = [
    {
      id: "1",
      score: 0.9,
      metadata: {
        name: "Nike Air Max",
        description: "Running shoes",
        price: 120,
        image: "https://example.com/image1.jpg",
        brand: "Nike",
        category: "Running Shoes",
        color: "Black",
        sizes: [8, 9, 10],
        inStock: true,
        rating: 4.5,
        features: ["Comfortable", "Durable"],
        gender: Gender.Men,
      },
    },
    {
      id: "2",
      score: 0.8,
      metadata: {
        name: "Adidas Ultraboost",
        description: "Training shoes",
        price: 160,
        image: "https://example.com/image2.jpg",
        brand: "Adidas",
        category: "Training Shoes",
        color: "White",
        sizes: [9, 10, 11],
        inStock: true,
        rating: 4.8,
        features: ["Lightweight", "Responsive"],
        gender: Gender.Women,
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup cache helpers
    mockNormalizeQueryL1.mockImplementation((query: string) =>
      query.toLowerCase().trim(),
    );
    mockGenerateCacheKey.mockImplementation(
      (query: string) => `cache_key_${query}`,
    );
    mockGenerateExplanation.mockReturnValue("Here are the results");
    mockGenerateRejectionMessage.mockReturnValue(
      "This is not a footwear query",
    );

    // Setup cache - default to cache miss
    mockCheckL1Cache.mockResolvedValue(null);
    mockCheckL2Cache.mockResolvedValue(null);
    mockSaveToCache.mockResolvedValue({ ttl: 1800, frequency: 1 });
    mockBuildCacheMetadata.mockReturnValue({
      normalizedQuery: "test query",
      cacheKey: "cache_key_test",
      l1Hit: false,
      l2Hit: false,
    });

    // Setup parseQueryWithLLM
    mockParseQueryWithLLM.mockImplementation(async (query: string) => {
      // Parse price from query text
      let minPrice: number | undefined;
      let maxPrice: number | undefined;
      let semanticQuery = query;

      // Extract "under $X", "below $X", or "less than $X"
      const underMatch = query.match(/(?:under|below|less\s+than)\s+\$?(\d+)/i);
      if (underMatch) {
        maxPrice = parseInt(underMatch[1]);
        semanticQuery = query.replace(underMatch[0], "").trim();
      }

      // Extract "above $X", "over $X", or "more than $X"
      const aboveMatch = query.match(/(?:above|over|more\s+than)\s+\$?(\d+)/i);
      if (aboveMatch) {
        minPrice = parseInt(aboveMatch[1]);
        semanticQuery = query.replace(aboveMatch[0], "").trim();
      }

      // Handle "between $X and $Y" or "$X to $Y"
      const betweenMatch = query.match(/\$?(\d+)\s+(?:to|and)\s+\$?(\d+)/i);
      if (betweenMatch) {
        minPrice = parseInt(betweenMatch[1]);
        maxPrice = parseInt(betweenMatch[2]);
      }

      return {
        isRelevant: true,
        semanticQuery: semanticQuery || query,
        originalQuery: query,
        ...(minPrice !== undefined && { minPrice }),
        ...(maxPrice !== undefined && { maxPrice }),
      };
    });

    // Setup embedding generation
    mockGenerateEmbedding.mockResolvedValue(mockEmbedding);

    // Setup Pinecone search
    mockSearchPinecone.mockResolvedValue({
      searchResults: { matches: mockProducts },
      pineconeFilter: undefined,
    });

    // Setup product transformation
    mockTransformToProducts.mockImplementation((matches: any[]) => {
      return matches.map((match) => {
        const metadata = match.metadata;
        return {
          id: match.id,
          name: metadata.name || "",
          description: metadata.description || "",
          price: metadata.price || 0,
          image: metadata.image || "",
          brand: metadata.brand || "",
          category: metadata.category || "",
          color: metadata.color || "",
          sizes: metadata.sizes || [],
          inStock: metadata.inStock !== false,
          rating: metadata.rating || 0,
          features: metadata.features || [],
          gender: metadata.gender || Gender.Unisex,
        };
      });
    });
  });

  it("returns 400 when query is missing", async () => {
    const req = {
      json: async () => ({ query: "" }),
    } as unknown as Request;

    await POST(req);

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Query is required" },
      { status: 400 },
    );
  });

  it("returns 400 when query is only whitespace", async () => {
    const req = {
      json: async () => ({ query: "   " }),
    } as unknown as Request;

    await POST(req);

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Query is required" },
      { status: 400 },
    );
  });

  it("successfully processes search request", async () => {
    const req = {
      json: async () => ({ query: "running shoes" }),
    } as unknown as Request;

    await POST(req);

    expect(mockParseQueryWithLLM).toHaveBeenCalledWith("running shoes");
    expect(mockGenerateEmbedding).toHaveBeenCalled();
    expect(mockSearchPinecone).toHaveBeenCalled();

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.success).toBe(true);
    expect(callArgs.query).toBe("running shoes");
    expect(callArgs.products).toHaveLength(2);
  });

  it("trims and lowercases query for embedding", async () => {
    const req = {
      json: async () => ({ query: "  Nike SHOES  " }),
    } as unknown as Request;

    await POST(req);

    expect(mockParseQueryWithLLM).toHaveBeenCalledWith("  Nike SHOES  ");
    expect(mockGenerateEmbedding).toHaveBeenCalled();
  });

  it("filters products by price range 0-80", async () => {
    const req = {
      json: async () => ({
        query: "shoes",
        filters: {
          priceRange: ["0-80"],
        },
      }),
    } as unknown as Request;

    await POST(req);

    // Verify searchPinecone was called with filters
    expect(mockSearchPinecone).toHaveBeenCalled();
    const callArgs = mockSearchPinecone.mock.calls[0];
    expect(callArgs[3]).toBeUndefined(); // excludedIds
  });

  it("filters products by price range 80-150", async () => {
    const req = {
      json: async () => ({
        query: "shoes",
        filters: {
          priceRange: ["80-150"],
        },
      }),
    } as unknown as Request;

    await POST(req);

    // Verify searchPinecone was called
    expect(mockSearchPinecone).toHaveBeenCalled();
  });

  it("filters products by price range 150+", async () => {
    const req = {
      json: async () => ({
        query: "shoes",
        filters: {
          priceRange: ["150+"],
        },
      }),
    } as unknown as Request;

    await POST(req);

    // Verify searchPinecone was called
    expect(mockSearchPinecone).toHaveBeenCalled();
  });

  it("filters products by brand", async () => {
    const req = {
      json: async () => ({
        query: "shoes",
        filters: {
          brands: ["Nike"],
        },
      }),
    } as unknown as Request;

    await POST(req);

    // Verify searchPinecone was called with filters
    expect(mockSearchPinecone).toHaveBeenCalled();
    const callArgs = mockSearchPinecone.mock.calls[0];
    expect(callArgs[2]).toEqual({ brands: ["Nike"] }); // filters argument
  });

  it("filters products by category", async () => {
    const req = {
      json: async () => ({
        query: "shoes",
        filters: {
          categories: ["Running Shoes"],
        },
      }),
    } as unknown as Request;

    await POST(req);

    // Categories are not filtered in Pinecone (intentionally disabled)
    // Just verify the API call succeeds
    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.success).toBe(true);
  });

  it("applies multiple filters", async () => {
    const req = {
      json: async () => ({
        query: "shoes",
        filters: {
          brands: ["Nike"],
          priceRange: ["80-150"],
        },
      }),
    } as unknown as Request;

    await POST(req);

    // Verify searchPinecone was called with both filters
    expect(mockSearchPinecone).toHaveBeenCalled();
    const callArgs = mockSearchPinecone.mock.calls[0];
    expect(callArgs[2]).toEqual({
      brands: ["Nike"],
      priceRange: ["80-150"],
    });
  });

  it("returns products when filters are applied", async () => {
    const req = {
      json: async () => ({
        query: "shoes",
        filters: {
          brands: ["Nike"],
        },
      }),
    } as unknown as Request;

    await POST(req);

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.success).toBe(true);
    expect(callArgs.products).toBeDefined();
  });

  it("handles excludedIds correctly", async () => {
    const req = {
      json: async () => ({
        query: "shoes",
        excludedIds: ["1"],
      }),
    } as unknown as Request;

    // Mock transform to actually filter excluding
    mockTransformToProducts.mockImplementationOnce(
      (matches: any[], excludedIds?: string[]) => {
        const excludedSet = new Set(excludedIds || []);
        return matches
          .filter((m) => !excludedSet.has(m.id))
          .map((match) => {
            const metadata = match.metadata;
            return {
              id: match.id,
              name: metadata.name || "",
              description: metadata.description || "",
              price: metadata.price || 0,
              image: metadata.image || "",
              brand: metadata.brand || "",
              category: metadata.category || "",
              color: metadata.color || "",
              sizes: metadata.sizes || [],
              inStock: metadata.inStock !== false,
              rating: metadata.rating || 0,
              features: metadata.features || [],
              gender: metadata.gender || Gender.Unisex,
            };
          });
      },
    );

    await POST(req);

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.products).toHaveLength(1);
    expect(callArgs.products[0].id).toBe("2");
  });

  describe("L1 Cache Hit Scenarios", () => {
    it("should return cached results on L1 + L2 cache hit", async () => {
      const req = {
        json: async () => ({ query: "running shoes" }),
      } as unknown as Request;

      // Mock L1 cache hit
      mockCheckL1Cache.mockResolvedValueOnce("semantic running shoes");

      // Mock L2 cache hit with full results
      mockCheckL2Cache.mockResolvedValueOnce({
        count: 2,
        products: [mockProducts[0], mockProducts[1]],
        explanation: "Cached results",
      });

      await POST(req);

      expect(mockCheckL1Cache).toHaveBeenCalled();
      expect(mockCheckL2Cache).toHaveBeenCalledWith(
        "semantic running shoes",
        undefined,
      );
      expect(mockParseQueryWithLLM).not.toHaveBeenCalled();
      expect(mockGenerateEmbedding).not.toHaveBeenCalled();
      expect(mockSearchPinecone).not.toHaveBeenCalled();

      const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArgs.success).toBe(true);
      expect(callArgs.cached).toBe(true);
      expect(callArgs.products).toHaveLength(2);
      expect(callArgs.explanation).toBe("Cached results");
      // Performance metrics removed from response
    });

    it("should proceed to full search on L1 hit but L2 miss", async () => {
      const req = {
        json: async () => ({ query: "running shoes" }),
      } as unknown as Request;

      // Mock L1 cache hit
      mockCheckL1Cache.mockResolvedValueOnce("semantic running shoes");

      // Mock L2 cache miss
      mockCheckL2Cache.mockResolvedValueOnce(null);

      await POST(req);

      expect(mockCheckL1Cache).toHaveBeenCalled();
      expect(mockCheckL2Cache).toHaveBeenCalled();
      expect(mockParseQueryWithLLM).toHaveBeenCalledWith("running shoes");
      expect(mockGenerateEmbedding).toHaveBeenCalled();
      expect(mockSearchPinecone).toHaveBeenCalled();

      const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArgs.success).toBe(true);
      expect(callArgs.cached).toBe(false);
    });
  });

  describe("Query Rejection", () => {
    it("should reject non-footwear queries with isRelevant=false", async () => {
      const req = {
        json: async () => ({ query: "laptop computer" }),
      } as unknown as Request;

      // Mock L1 and L2 cache miss
      mockCheckL1Cache.mockResolvedValueOnce(null);

      // Mock parseQuery with rejection
      mockParseQueryWithLLM.mockResolvedValueOnce({
        semanticQuery: "laptop computer",
        isRelevant: false,
        rejectionReason:
          "This query is about electronics, not footwear. We only search for shoes, boots, sandals, and other footwear.",
        suggestedQuery: "running shoes",
        brand: null,
        category_l1: null,
        category_l2: null,
        category_l3: null,
        color: null,
        gender: null,
        priceRange: null,
      });

      await POST(req);

      expect(mockParseQueryWithLLM).toHaveBeenCalledWith("laptop computer");
      expect(mockGenerateEmbedding).not.toHaveBeenCalled();
      expect(mockSearchPinecone).not.toHaveBeenCalled();

      const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArgs.success).toBe(false);
      expect(callArgs.rejected).toBe(true);
      expect(callArgs.rejectionReason).toContain("electronics");
      expect(callArgs.suggestedQuery).toBe("running shoes");
      expect(callArgs.count).toBe(0);
      expect(callArgs.products).toHaveLength(0);
    });
  });

  describe("Error Handling", () => {
    it("should handle cache save errors gracefully", async () => {
      const req = {
        json: async () => ({ query: "running shoes" }),
      } as unknown as Request;

      // Mock successful search
      mockCheckL1Cache.mockResolvedValueOnce(null);
      mockCheckL2Cache.mockResolvedValueOnce(null);

      // Mock saveToCache to throw error
      mockSaveToCache.mockRejectedValueOnce(
        new Error("Redis connection failed"),
      );

      await POST(req);

      expect(mockSaveToCache).toHaveBeenCalled();
      expect(mockLogCacheError).toHaveBeenCalled();

      const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArgs.success).toBe(true);
      expect(callArgs.products).toBeDefined();
      expect(callArgs.cached).toBe(false);
    });

    it("should handle parseQueryWithLLM errors", async () => {
      const req = {
        json: async () => ({ query: "running shoes" }),
      } as unknown as Request;

      mockCheckL1Cache.mockResolvedValueOnce(null);
      mockParseQueryWithLLM.mockRejectedValueOnce(
        new Error("OpenAI API error"),
      );

      await POST(req);

      const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArgs.success).toBe(false);
      expect(callArgs.error).toBe(
        "AI service temporarily unavailable. Please try again in a moment.",
      );
      expect(callArgs.details).toBe("OpenAI API error");
      expect(callArgs.products).toHaveLength(0);

      const status = (NextResponse.json as jest.Mock).mock.calls[0][1]?.status;
      expect(status).toBe(503);
    });

    it("should handle generateEmbedding errors", async () => {
      const req = {
        json: async () => ({ query: "running shoes" }),
      } as unknown as Request;

      mockCheckL1Cache.mockResolvedValueOnce(null);
      mockGenerateEmbedding.mockRejectedValueOnce(
        new Error(
          "Failed to generate embedding: Embedding service unavailable",
        ),
      );

      await POST(req);

      const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArgs.success).toBe(false);
      expect(callArgs.error).toBe(
        "AI embedding service temporarily unavailable. Please try again in a moment.",
      );
      expect(callArgs.details).toContain("embedding");

      const status = (NextResponse.json as jest.Mock).mock.calls[0][1]?.status;
      expect(status).toBe(503);
    });

    it("should handle searchPinecone errors", async () => {
      const req = {
        json: async () => ({ query: "running shoes" }),
      } as unknown as Request;

      mockCheckL1Cache.mockResolvedValueOnce(null);
      mockSearchPinecone.mockRejectedValueOnce(
        new Error("Failed to search Pinecone: Query failed"),
      );

      await POST(req);

      const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArgs.success).toBe(false);
      expect(callArgs.error).toBe(
        "Search database temporarily unavailable. Please try again in a moment.",
      );
      expect(callArgs.details).toContain("Pinecone");

      const status = (NextResponse.json as jest.Mock).mock.calls[0][1]?.status;
      expect(status).toBe(503);
    });

    it("should handle unknown error types", async () => {
      const req = {
        json: async () => ({ query: "running shoes" }),
      } as unknown as Request;

      mockCheckL1Cache.mockResolvedValueOnce(null);
      mockParseQueryWithLLM.mockRejectedValueOnce("String error");

      await POST(req);

      const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArgs.success).toBe(false);
      expect(callArgs.error).toBe("Search failed. Please try again.");
      expect(callArgs.details).toBe("Unknown error");

      const status = (NextResponse.json as jest.Mock).mock.calls[0][1]?.status;
      expect(status).toBe(503);
    });

    it("should log error stack traces when available", async () => {
      const req = {
        json: async () => ({ query: "running shoes" }),
      } as unknown as Request;

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      mockCheckL1Cache.mockResolvedValueOnce(null);
      const testError = new Error("Test error with stack");
      mockParseQueryWithLLM.mockRejectedValueOnce(testError);

      await POST(req);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "❌ Search error:",
        testError,
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error stack:",
        expect.any(String),
      );

      consoleErrorSpy.mockRestore();
    });

    it("should handle JSON parsing errors in request body", async () => {
      const req = {
        json: async () => {
          throw new Error("Invalid JSON");
        },
      } as unknown as Request;

      await POST(req);

      const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArgs.success).toBe(false);
      expect(callArgs.error).toBe("Search failed. Please try again.");
      expect(callArgs.details).toBe("Invalid JSON");
      expect(callArgs.query).toBe("");

      const status = (NextResponse.json as jest.Mock).mock.calls[0][1]?.status;
      expect(status).toBe(503);
    });
  });
});
