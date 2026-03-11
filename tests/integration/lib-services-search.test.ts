/**
 * Integration tests for lib/services/search
 * Testing cache and pinecone search services
 */

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
import { Gender } from "@/lib/types";
import type { ParsedQuery, Product } from "@/lib/types";
import { redis, getAdaptiveTTL, trackQueryFrequency } from "@/lib/redis";
import { openai } from "@/lib/openai";
import { index } from "@/lib/pinecone";

// Mock redis
jest.mock("@/lib/redis", () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    zscore: jest.fn(),
    expire: jest.fn(),
  },
  CACHE_PREFIXES: {
    L1: "l1:",
    L2: "l2:",
    FREQUENCY: "freq:",
  },
  getAdaptiveTTL: jest.fn().mockResolvedValue(3600),
  trackQueryFrequency: jest.fn().mockResolvedValue(undefined),
}));

// Mock OpenAI
jest.mock("@/lib/openai", () => ({
  openai: {
    embeddings: {
      create: jest.fn().mockResolvedValue({
        data: [
          {
            embedding: Array.from({ length: 1536 }, (_, i) => i * 0.001),
          },
        ],
      }),
    },
  },
}));

// Mock Pinecone
jest.mock("@/lib/pinecone", () => ({
  index: {
    namespace: jest.fn().mockReturnValue({
      query: jest.fn().mockResolvedValue({
        matches: [
          {
            id: "prod-1",
            score: 0.95,
            metadata: {
              name: "Nike Air Max",
              description: "Comfortable running shoes",
              price: 120,
              image: "https://example.com/image.jpg",
              brand: "Nike",
              category: "Shoes",
              color: "blue",
              sizes: [8, 9, 10, 11],
              inStock: true,
              rating: 4.5,
              features: ["lightweight", "breathable"],
              gender: "men",
            },
          },
          {
            id: "prod-2",
            score: 0.88,
            metadata: {
              name: "Adidas Ultraboost",
              description: "High performance running shoes",
              price: 180,
              image: "https://example.com/image2.jpg",
              brand: "Adidas",
              category: "Shoes",
              color: "black",
              sizes: [7, 8, 9, 10],
              inStock: true,
              rating: 4.7,
              features: ["responsive", "comfortable"],
              gender: "women",
            },
          },
        ],
      }),
    }),
  },
}));

// Environment variables are set in jest.setup.js
// OPENAI_EMBEDDING_MODEL = "test-embedding-model"
// PINECONE_NAMESPACE = "test-namespace"

const mockedRedis = jest.mocked(redis);
const mockedGetAdaptiveTTL = jest.mocked(getAdaptiveTTL);
const _mockedTrackQueryFrequency = jest.mocked(trackQueryFrequency);
const mockedOpenai = jest.mocked(openai);
const mockedIndex = jest.mocked(index);

describe("Integration: lib/services/search/cache", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("checkL1Cache", () => {
    it("should check L1 cache and return semantic query", async () => {
      mockedRedis.get.mockResolvedValue("running shoes for athletics");

      const result = await checkL1Cache("nike_running_shoes");

      expect(mockedRedis.get).toHaveBeenCalledWith("l1:nike_running_shoes");
      expect(result).toBe("running shoes for athletics");
    });

    it("should return null if L1 cache miss", async () => {
      mockedRedis.get.mockResolvedValue(null);

      const result = await checkL1Cache("new_query");

      expect(mockedRedis.get).toHaveBeenCalledWith("l1:new_query");
      expect(result).toBeNull();
    });

    it("should handle cache errors gracefully", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      mockedRedis.get.mockRejectedValue(new Error("Redis connection failed"));

      const result = await checkL1Cache("test_key");

      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "⚠️ L1 cache check failed (Redis unavailable):",
        "Redis connection failed",
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe("checkL2Cache", () => {
    it("should check L2 cache and return cached results", async () => {
      const mockCachedResult = {
        products: [
          {
            id: "prod-1",
            name: "Nike Air Max",
            price: 120,
          },
        ],
        explanation: "Found athletic shoes",
        count: 1,
        parsedQuery: { semanticQuery: "running shoes" },
        timestamp: Date.now(),
      };

      mockedRedis.get.mockResolvedValue(mockCachedResult);

      const result = await checkL2Cache("running shoes");

      expect(mockedRedis.get).toHaveBeenCalled();
      expect(result).toEqual(mockCachedResult);
    });

    it("should return null if L2 cache miss", async () => {
      mockedRedis.get.mockResolvedValue(null);

      const result = await checkL2Cache("new semantic query");

      expect(result).toBeNull();
    });

    it("should handle filters in cache key", async () => {
      mockedRedis.get.mockResolvedValue(null);

      await checkL2Cache("shoes", {
        brands: ["Nike"],
        priceRange: ["0-100"],
      });

      expect(mockedRedis.get).toHaveBeenCalled();
    });

    it("should handle empty filters", async () => {
      mockedRedis.get.mockResolvedValue(null);

      await checkL2Cache("shoes", {});

      expect(mockedRedis.get).toHaveBeenCalled();
    });

    it("should handle cache errors gracefully", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      mockedRedis.get.mockRejectedValue(new Error("Redis connection failed"));

      const result = await checkL2Cache("test_query", { brands: ["Nike"] });

      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "⚠️ L2 cache check failed (Redis unavailable):",
        "Redis connection failed",
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe("saveToCache", () => {
    it("should save to both L1 and L2 cache with adaptive TTL", async () => {
      mockedRedis.set.mockResolvedValue(undefined);
      mockedRedis.zscore.mockResolvedValue(5);
      mockedGetAdaptiveTTL.mockResolvedValue(7200);

      const products: Product[] = [
        {
          id: "prod-1",
          name: "Nike Air Max",
          description: "Running shoes",
          price: 120,
          image: "image.jpg",
          brand: "Nike",
          category: "Shoes",
          color: "blue",
          sizes: [8, 9, 10],
          inStock: true,
          rating: 4.5,
          features: ["lightweight"],
          gender: Gender.Men,
        },
      ];

      const parsedQuery: ParsedQuery = {
        semanticQuery: "running shoes",
        originalQuery: "running shoes",
        gender: Gender.Men,
        category: "Shoes",
      };

      const result = await saveToCache(
        "nike_shoes",
        "athletic footwear",
        products,
        "Found running shoes",
        parsedQuery,
      );

      expect(getAdaptiveTTL).toHaveBeenCalledWith("nike_shoes");
      expect(mockedRedis.set).toHaveBeenCalledTimes(2); // L1 and L2
      expect(trackQueryFrequency).toHaveBeenCalledWith("nike_shoes");
      expect(result).toEqual({ ttl: 7200, frequency: 5 });
    });

    it("should save with filters", async () => {
      mockedRedis.set.mockResolvedValue(undefined);
      mockedRedis.zscore.mockResolvedValue(1);
      mockedGetAdaptiveTTL.mockResolvedValue(3600);

      const products: Product[] = [];
      const parsedQuery: ParsedQuery = {
        semanticQuery: "shoes",
        originalQuery: "shoes",
      };

      await saveToCache(
        "test_key",
        "shoes",
        products,
        "No results",
        parsedQuery,
        { brands: ["Nike"] },
      );

      expect(mockedRedis.set).toHaveBeenCalledTimes(2);
    });

    it("should handle frequency of 0 for new queries", async () => {
      mockedRedis.set.mockResolvedValue(undefined);
      mockedRedis.zscore.mockResolvedValue(null); // New query
      mockedGetAdaptiveTTL.mockResolvedValue(1800);

      const result = await saveToCache("new_query", "test", [], "test", {
        semanticQuery: "test",
        originalQuery: "test",
      });

      expect(result.frequency).toBe(1);
    });

    it("should save cache with timestamp", async () => {
      mockedRedis.set.mockResolvedValue(undefined);
      mockedRedis.zscore.mockResolvedValue(3);

      const products: Product[] = [];
      const parsedQuery: ParsedQuery = {
        semanticQuery: "test",
        originalQuery: "test",
      };

      await saveToCache(
        "test",
        "test query",
        products,
        "explanation",
        parsedQuery,
      );

      const l2CallArg = mockedRedis.set.mock.calls[1][1] as {
        timestamp?: number;
      };
      expect(l2CallArg).toHaveProperty("timestamp");
      expect(typeof l2CallArg.timestamp).toBe("number");
    });

    it("should handle cache save errors gracefully", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      mockedGetAdaptiveTTL.mockRejectedValue(
        new Error("Redis connection failed"),
      );

      const products: Product[] = [];
      const parsedQuery: ParsedQuery = {
        semanticQuery: "test",
        originalQuery: "test",
      };

      const result = await saveToCache(
        "test_key",
        "test_query",
        products,
        "explanation",
        parsedQuery,
      );

      expect(result).toEqual({ ttl: 1800, frequency: 0 });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "⚠️ Cache save failed (Redis unavailable):",
        "Redis connection failed",
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe("buildCacheMetadata", () => {
    it("should build complete cache metadata", () => {
      const metadata = buildCacheMetadata(
        "nike running shoes",
        "l1:nike_running_shoes",
        true,
        true,
        3600,
        5,
      );

      expect(metadata).toEqual({
        normalizedQuery: "nike running shoes",
        cacheKey: "l1:nike_running_shoes",
        l1Hit: true,
        l2Hit: true,
        ttl: 3600,
        frequency: 5,
      });
    });

    it("should build metadata with cache miss", () => {
      const metadata = buildCacheMetadata(
        "new query",
        "l1:new_query",
        false,
        false,
      );

      expect(metadata).toEqual({
        normalizedQuery: "new query",
        cacheKey: "l1:new_query",
        l1Hit: false,
        l2Hit: false,
        ttl: undefined,
        frequency: undefined,
      });
    });

    it("should build metadata with L1 hit but L2 miss", () => {
      const metadata = buildCacheMetadata(
        "test query",
        "l1:test",
        true,
        false,
        1800,
        2,
      );

      expect(metadata.l1Hit).toBe(true);
      expect(metadata.l2Hit).toBe(false);
      expect(metadata.ttl).toBe(1800);
      expect(metadata.frequency).toBe(2);
    });

    it("should handle undefined optional parameters", () => {
      const metadata = buildCacheMetadata(
        "query",
        "key",
        false,
        false,
        undefined,
        undefined,
      );

      expect(metadata.ttl).toBeUndefined();
      expect(metadata.frequency).toBeUndefined();
    });
  });
});

describe("Integration: lib/services/search/pinecone", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateEmbedding", () => {
    it("should generate embedding for search query", async () => {
      const result = await generateEmbedding("running shoes");

      expect(mockedOpenai.embeddings.create).toHaveBeenCalledWith({
        model: "test-embedding-model",
        input: "running shoes",
      });
      expect(result).toHaveLength(1536);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should lowercase and trim input", async () => {
      await generateEmbedding("  Nike Running SHOES  ");

      expect(mockedOpenai.embeddings.create).toHaveBeenCalledWith({
        model: "test-embedding-model",
        input: "nike running shoes",
      });
    });

    it("should handle empty string", async () => {
      await generateEmbedding("");

      expect(mockedOpenai.embeddings.create).toHaveBeenCalledWith({
        model: "test-embedding-model",
        input: "",
      });
    });

    it("should handle special characters", async () => {
      await generateEmbedding("Men's running shoes!");

      expect(mockedOpenai.embeddings.create).toHaveBeenCalledWith({
        model: "test-embedding-model",
        input: "men's running shoes!",
      });
    });

    it("should handle OpenAI API errors", async () => {
      mockedOpenai.embeddings.create.mockRejectedValueOnce(
        new Error("API rate limit exceeded"),
      );

      await expect(generateEmbedding("test")).rejects.toThrow(
        "API rate limit exceeded",
      );
    });
  });

  describe("searchPinecone", () => {
    it("should search pinecone with embedding and filters", async () => {
      const embedding = Array.from({ length: 1536 }, (_, i) => i * 0.001);
      const parsedQuery: ParsedQuery = {
        semanticQuery: "running shoes",
        originalQuery: "running shoes",
        gender: Gender.Men,
        category: "Shoes",
      };

      const result = await searchPinecone(embedding, parsedQuery);

      expect(mockedIndex.namespace).toHaveBeenCalledWith("test-namespace");
      const namespace = mockedIndex.namespace("test-namespace");
      expect(namespace.query).toHaveBeenCalledWith(
        expect.objectContaining({
          vector: embedding,
          topK: 50,
          includeMetadata: true,
        }),
      );
      expect(result.searchResults.matches).toHaveLength(2);
    });

    it("should handle UI filters", async () => {
      const embedding = new Array(1536).fill(0.001);
      const parsedQuery: ParsedQuery = {
        semanticQuery: "shoes",
        originalQuery: "shoes",
      };

      await searchPinecone(embedding, parsedQuery, {
        brands: ["Nike"],
        categories: ["Shoes"],
      });

      const namespace = mockedIndex.namespace("test-namespace");
      expect(namespace.query).toHaveBeenCalled();
    });

    it("should adjust topK with excluded IDs", async () => {
      const embedding = new Array(1536).fill(0.001);
      const parsedQuery: ParsedQuery = {
        semanticQuery: "test",
        originalQuery: "test",
      };
      const excludedIds = ["prod-1", "prod-2", "prod-3"];

      await searchPinecone(embedding, parsedQuery, undefined, excludedIds);

      const namespace = mockedIndex.namespace("test-namespace");
      expect(namespace.query).toHaveBeenCalledWith(
        expect.objectContaining({
          topK: 53, // 50 + 3 excluded IDs
        }),
      );
    });

    it("should limit topK to 100 max", async () => {
      const embedding = new Array(1536).fill(0.001);
      const parsedQuery: ParsedQuery = {
        semanticQuery: "test",
        originalQuery: "test",
      };
      const excludedIds = new Array(100).fill("").map((_, i) => `prod-${i}`);

      await searchPinecone(embedding, parsedQuery, undefined, excludedIds);

      const namespace = mockedIndex.namespace("test-namespace");
      expect(namespace.query).toHaveBeenCalledWith(
        expect.objectContaining({
          topK: 100, // capped at 100
        }),
      );
    });

    it("should return pinecone filter from query parser", async () => {
      const embedding = new Array(1536).fill(0.001);
      const parsedQuery: ParsedQuery = {
        semanticQuery: "shoes",
        originalQuery: "shoes",
        gender: Gender.Men,
        minPrice: 50,
        maxPrice: 150,
      };

      const result = await searchPinecone(embedding, parsedQuery);

      expect(result).toHaveProperty("pineconeFilter");
    });
  });

  describe("transformToProducts", () => {
    it("should transform pinecone matches to products", () => {
      const matches = [
        {
          id: "prod-1",
          metadata: {
            name: "Nike Air Max",
            description: "Running shoes",
            price: 120,
            image: "image.jpg",
            brand: "Nike",
            category: "Shoes",
            color: "blue",
            sizes: [8, 9, 10],
            inStock: true,
            rating: 4.5,
            features: ["lightweight"],
            gender: "men",
          },
        },
      ];

      const products = transformToProducts(matches);

      expect(products).toHaveLength(1);
      expect(products[0]).toEqual({
        id: "prod-1",
        name: "Nike Air Max",
        description: "Running shoes",
        price: 120,
        image: "image.jpg",
        brand: "Nike",
        category: "Shoes",
        color: "blue",
        sizes: [8, 9, 10],
        inStock: true,
        rating: 4.5,
        features: ["lightweight"],
        gender: "men",
      });
    });

    it("should filter out excluded IDs", () => {
      const matches = [
        {
          id: "prod-1",
          metadata: {
            name: "Nike Air Max",
            price: 120,
            brand: "Nike",
            category: "Shoes",
            description: "",
            image: "",
            color: "",
            sizes: [],
            inStock: true,
            rating: 0,
            features: [],
            gender: "men",
          },
        },
        {
          id: "prod-2",
          metadata: {
            name: "Adidas",
            price: 150,
            brand: "Adidas",
            category: "Shoes",
            description: "",
            image: "",
            color: "",
            sizes: [],
            inStock: true,
            rating: 0,
            features: [],
            gender: "women",
          },
        },
      ];

      const products = transformToProducts(matches, ["prod-1"]);

      expect(products).toHaveLength(1);
      expect(products[0].id).toBe("prod-2");
    });

    it("should handle missing metadata fields with defaults", () => {
      const matches = [
        {
          id: "prod-incomplete",
          metadata: {
            name: "Test Product",
          },
        },
      ];

      const products = transformToProducts(matches);

      expect(products[0]).toEqual({
        id: "prod-incomplete",
        name: "Test Product",
        description: "",
        price: 0,
        image: "",
        brand: "",
        category: "",
        color: "",
        sizes: [],
        inStock: true,
        rating: 0,
        features: [],
        gender: Gender.Unisex,
      });
    });

    it("should handle inStock false", () => {
      const matches = [
        {
          id: "prod-out-of-stock",
          metadata: {
            name: "Out of Stock Item",
            inStock: false,
            price: 100,
            brand: "Test",
            category: "Test",
            description: "",
            image: "",
            color: "",
            sizes: [],
            rating: 0,
            features: [],
            gender: "unisex",
          },
        },
      ];

      const products = transformToProducts(matches);

      expect(products[0].inStock).toBe(false);
    });

    it("should handle empty matches array", () => {
      const products = transformToProducts([]);

      expect(products).toHaveLength(0);
      expect(products).toEqual([]);
    });

    it("should handle all products being excluded", () => {
      const matches = [
        { id: "prod-1", metadata: { name: "Product 1" } },
        { id: "prod-2", metadata: { name: "Product 2" } },
      ];

      const products = transformToProducts(matches, ["prod-1", "prod-2"]);

      expect(products).toHaveLength(0);
    });

    it("should handle no excluded IDs", () => {
      const matches = [
        {
          id: "prod-1",
          metadata: {
            name: "Product 1",
            price: 100,
            brand: "Brand",
            category: "Category",
            description: "",
            image: "",
            color: "",
            sizes: [],
            inStock: true,
            rating: 0,
            features: [],
            gender: "unisex",
          },
        },
      ];

      const products = transformToProducts(matches, undefined);

      expect(products).toHaveLength(1);
    });

    it("should preserve all product details", () => {
      const matches = [
        {
          id: "prod-detailed",
          metadata: {
            name: "Detailed Product",
            description: "This is a detailed description",
            price: 250,
            image: "https://example.com/detailed.jpg",
            brand: "Premium Brand",
            category: "Premium Shoes",
            color: "red",
            sizes: [7, 8, 9, 10, 11, 12],
            inStock: true,
            rating: 4.8,
            features: ["premium", "durable", "stylish"],
            gender: "women",
          },
        },
      ];

      const products = transformToProducts(matches);

      expect(products[0]).toEqual({
        id: "prod-detailed",
        name: "Detailed Product",
        description: "This is a detailed description",
        price: 250,
        image: "https://example.com/detailed.jpg",
        brand: "Premium Brand",
        category: "Premium Shoes",
        color: "red",
        sizes: [7, 8, 9, 10, 11, 12],
        inStock: true,
        rating: 4.8,
        features: ["premium", "durable", "stylish"],
        gender: "women",
      });
    });
  });
});
