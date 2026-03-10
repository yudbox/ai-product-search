/**
 * Unit tests for Cache Service
 */

// Mock dependencies BEFORE imports with factory functions
jest.mock("@/lib/redis", () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    zscore: jest.fn(),
    zincrby: jest.fn(),
  },
  CACHE_PREFIXES: {
    L1: "l1:",
    L2: "l2:",
    FREQUENCY: "freq:",
  },
  getAdaptiveTTL: jest.fn(),
  trackQueryFrequency: jest.fn(),
}));

jest.mock("@/lib/utils/searchHelpers");

import {
  checkL1Cache,
  checkL2Cache,
  saveToCache,
  buildCacheMetadata,
} from "../cache";
import {
  redis,
  CACHE_PREFIXES,
  getAdaptiveTTL,
  trackQueryFrequency,
} from "@/lib/redis";
import { generateCacheKey } from "@/lib/utils/searchHelpers";
import { Gender } from "@/lib/types";
import type { Product, ParsedQuery, CachedSearchResult } from "@/lib/types";

const mockRedis = jest.mocked(redis);
const mockGetAdaptiveTTL = jest.mocked(getAdaptiveTTL);
const mockTrackQueryFrequency = jest.mocked(trackQueryFrequency);
const mockGenerateCacheKey = jest.mocked(generateCacheKey);

describe("cache service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("checkL1Cache", () => {
    it("should check L1 cache with correct prefix", async () => {
      mockRedis.get.mockResolvedValueOnce("running shoes");

      const result = await checkL1Cache("test-query");

      expect(mockRedis.get).toHaveBeenCalledWith(
        `${CACHE_PREFIXES.L1}test-query`,
      );
      expect(result).toBe("running shoes");
    });

    it("should return null when cache miss", async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      const result = await checkL1Cache("non-existent");

      expect(result).toBeNull();
    });

    it("should handle different query keys", async () => {
      mockRedis.get.mockResolvedValueOnce("nike shoes");

      const result = await checkL1Cache("nike-running-shoes");

      expect(mockRedis.get).toHaveBeenCalledWith(
        `${CACHE_PREFIXES.L1}nike-running-shoes`,
      );
      expect(result).toBe("nike shoes");
    });
  });

  describe("checkL2Cache", () => {
    it("should check L2 cache without filters", async () => {
      mockGenerateCacheKey.mockReturnValueOnce("semantic-query");
      const cachedResult: CachedSearchResult = {
        products: [],
        explanation: "Test explanation",
        count: 0,
        parsedQuery: {
          semanticQuery: "semantic-query",
          originalQuery: "test",
        },
        timestamp: Date.now(),
      };

      mockRedis.get.mockResolvedValueOnce(cachedResult);

      const result = await checkL2Cache("semantic-query");

      expect(mockGenerateCacheKey).toHaveBeenCalledWith(
        "semantic-query",
        undefined,
      );
      expect(mockRedis.get).toHaveBeenCalledWith(
        `${CACHE_PREFIXES.L2}semantic-query`,
      );
      expect(result).toEqual(cachedResult);
    });

    it("should check L2 cache with filters", async () => {
      mockGenerateCacheKey.mockReturnValueOnce("semantic-query|br:Nike");
      const filters = { brands: ["Nike"] };

      mockRedis.get.mockResolvedValueOnce(null);

      const result = await checkL2Cache("semantic-query", filters);

      expect(mockGenerateCacheKey).toHaveBeenCalledWith(
        "semantic-query",
        filters,
      );
      expect(mockRedis.get).toHaveBeenCalledWith(
        `${CACHE_PREFIXES.L2}semantic-query|br:Nike`,
      );
      expect(result).toBeNull();
    });

    it("should return cached products and metadata", async () => {
      const mockProducts: Product[] = [
        {
          id: "1",
          name: "Nike Air Max",
          brand: "Nike",
          price: 120,
          category: "Sneakers",
          color: "red",
          gender: Gender.Men,
          image: "image1.jpg",
          description: "Running shoes",
          sizes: [8, 9, 10],
          inStock: true,
          rating: 4.5,
          features: ["Cushioned"],
        },
      ];

      const cachedResult: CachedSearchResult = {
        products: mockProducts,
        explanation: "Found 1 product",
        count: 1,
        parsedQuery: {
          semanticQuery: "running shoes",
          originalQuery: "running shoes",
        },
        timestamp: Date.now(),
      };

      mockGenerateCacheKey.mockReturnValueOnce("running-shoes");
      mockRedis.get.mockResolvedValueOnce(cachedResult);

      const result = await checkL2Cache("running shoes");

      expect(result).toEqual(cachedResult);
      expect(result?.products).toHaveLength(1);
      expect(result?.products[0].name).toBe("Nike Air Max");
    });
  });

  describe("saveToCache", () => {
    const mockProducts: Product[] = [
      {
        id: "1",
        name: "Test Shoe",
        brand: "Nike",
        price: 100,
        category: "Sneakers",
        color: "red",
        gender: Gender.Men,
        image: "image.jpg",
        description: "Test description",
        sizes: [8, 9, 10],
        inStock: true,
        rating: 4.5,
        features: ["Test"],
      },
    ];

    const mockParsedQuery: ParsedQuery = {
      semanticQuery: "running shoes",
      originalQuery: "running shoes",
    };

    beforeEach(() => {
      mockGenerateCacheKey.mockReturnValue("semantic-query");
      mockGetAdaptiveTTL.mockResolvedValue(3600);
      mockRedis.set.mockResolvedValue(undefined);
      mockTrackQueryFrequency.mockResolvedValue(undefined);
      mockRedis.zscore.mockResolvedValue(5);
    });

    it("should save to both L1 and L2 cache", async () => {
      const result = await saveToCache(
        "test-query",
        "running shoes",
        mockProducts,
        "Test explanation",
        mockParsedQuery,
      );

      // Check L1 save
      expect(mockRedis.set).toHaveBeenCalledWith(
        `${CACHE_PREFIXES.L1}test-query`,
        "running shoes",
        { ex: 3600 },
      );

      // Check L2 save
      expect(mockRedis.set).toHaveBeenCalledWith(
        `${CACHE_PREFIXES.L2}semantic-query`,
        expect.objectContaining({
          products: mockProducts,
          explanation: "Test explanation",
          count: 1,
          parsedQuery: mockParsedQuery,
        }),
        { ex: 3600 },
      );

      expect(result).toEqual({ ttl: 3600, frequency: 5 });
    });

    it("should use adaptive TTL", async () => {
      mockGetAdaptiveTTL.mockResolvedValueOnce(7200);

      const result = await saveToCache(
        "popular-query",
        "nike shoes",
        mockProducts,
        "Explanation",
        mockParsedQuery,
      );

      expect(mockGetAdaptiveTTL).toHaveBeenCalledWith("popular-query");
      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.anything(),
        { ex: 7200 },
      );
      expect(result.ttl).toBe(7200);
    });

    it("should save with filters", async () => {
      mockGenerateCacheKey.mockReturnValueOnce("semantic-query|br:Nike");
      const filters = { brands: ["Nike"] };

      await saveToCache(
        "test-query",
        "nike shoes",
        mockProducts,
        "Explanation",
        mockParsedQuery,
        filters,
      );

      expect(mockGenerateCacheKey).toHaveBeenCalledWith("nike shoes", filters);
      expect(mockRedis.set).toHaveBeenCalledWith(
        `${CACHE_PREFIXES.L2}semantic-query|br:Nike`,
        expect.objectContaining({
          filters,
        }),
        { ex: 3600 },
      );
    });

    it("should track query frequency", async () => {
      await saveToCache(
        "test-query",
        "running shoes",
        mockProducts,
        "Explanation",
        mockParsedQuery,
      );

      expect(mockTrackQueryFrequency).toHaveBeenCalledWith("test-query");
      expect(mockRedis.zscore).toHaveBeenCalledWith(
        `${CACHE_PREFIXES.FREQUENCY}queries`,
        "test-query",
      );
    });

    it("should handle missing frequency score", async () => {
      mockRedis.zscore.mockResolvedValueOnce(null);

      const result = await saveToCache(
        "new-query",
        "new shoes",
        mockProducts,
        "Explanation",
        mockParsedQuery,
      );

      expect(result.frequency).toBe(1); // Default to 1
    });

    it("should include timestamp in cached result", async () => {
      const beforeTimestamp = Date.now();

      await saveToCache(
        "test-query",
        "running shoes",
        mockProducts,
        "Explanation",
        mockParsedQuery,
      );

      const afterTimestamp = Date.now();

      const l2SaveCall = mockRedis.set.mock.calls.find((call) =>
        call[0].startsWith(CACHE_PREFIXES.L2),
      );
      const cachedResult = l2SaveCall?.[1] as CachedSearchResult;

      expect(cachedResult.timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
      expect(cachedResult.timestamp).toBeLessThanOrEqual(afterTimestamp);
    });

    it("should save correct product count", async () => {
      const multipleProducts: Product[] = [
        ...mockProducts,
        { ...mockProducts[0], id: "2", name: "Product 2" },
        { ...mockProducts[0], id: "3", name: "Product 3" },
      ];

      await saveToCache(
        "test-query",
        "running shoes",
        multipleProducts,
        "Explanation",
        mockParsedQuery,
      );

      const l2SaveCall = mockRedis.set.mock.calls.find((call) =>
        call[0].startsWith(CACHE_PREFIXES.L2),
      );
      const cachedResult = l2SaveCall?.[1] as CachedSearchResult;

      expect(cachedResult.count).toBe(3);
    });
  });

  describe("buildCacheMetadata", () => {
    it("should build metadata for L1 hit", () => {
      const result = buildCacheMetadata(
        "running shoes",
        "cache-key-123",
        true,
        false,
      );

      expect(result).toEqual({
        normalizedQuery: "running shoes",
        cacheKey: "cache-key-123",
        l1Hit: true,
        l2Hit: false,
        ttl: undefined,
        frequency: undefined,
      });
    });

    it("should build metadata for L2 hit", () => {
      const result = buildCacheMetadata(
        "running shoes",
        "cache-key-123",
        false,
        true,
      );

      expect(result).toEqual({
        normalizedQuery: "running shoes",
        cacheKey: "cache-key-123",
        l1Hit: false,
        l2Hit: true,
        ttl: undefined,
        frequency: undefined,
      });
    });

    it("should build metadata for cache miss", () => {
      const result = buildCacheMetadata(
        "unique query",
        "cache-key-456",
        false,
        false,
      );

      expect(result).toEqual({
        normalizedQuery: "unique query",
        cacheKey: "cache-key-456",
        l1Hit: false,
        l2Hit: false,
        ttl: undefined,
        frequency: undefined,
      });
    });

    it("should include TTL and frequency when provided", () => {
      const result = buildCacheMetadata(
        "popular query",
        "cache-key-789",
        true,
        true,
        7200,
        10,
      );

      expect(result).toEqual({
        normalizedQuery: "popular query",
        cacheKey: "cache-key-789",
        l1Hit: true,
        l2Hit: true,
        ttl: 7200,
        frequency: 10,
      });
    });

    it("should handle zero frequency", () => {
      const result = buildCacheMetadata(
        "new query",
        "cache-key-new",
        false,
        false,
        3600,
        0,
      );

      expect(result.frequency).toBe(0);
    });

    it("should handle different query formats", () => {
      const result = buildCacheMetadata(
        "nike|running|shoes",
        "complex-key",
        true,
        true,
        3600,
        5,
      );

      expect(result.normalizedQuery).toBe("nike|running|shoes");
      expect(result.cacheKey).toBe("complex-key");
    });
  });
});
