/**
 * Unit tests for Redis Cache Configuration and Utilities
 */

// Mock the Redis clients BEFORE importing index.ts
jest.mock("../dockerRedisClient", () => ({
  DockerRedisClient: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    zscore: jest.fn(),
    zincrby: jest.fn(),
  })),
}));

jest.mock("../vercelKvClient", () => ({
  VercelKvClient: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    zscore: jest.fn(),
    zincrby: jest.fn(),
  })),
}));

import {
  redis,
  CACHE_PREFIXES,
  TTL_STRATEGY,
  FREQUENCY_THRESHOLDS,
  getAdaptiveTTL,
  trackQueryFrequency,
} from "../index";

const mockRedis = redis as jest.Mocked<typeof redis>;

describe("redis configuration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("CACHE_PREFIXES", () => {
    it("should define L1 cache prefix", () => {
      expect(CACHE_PREFIXES.L1).toBe("l1:");
    });

    it("should define L2 cache prefix", () => {
      expect(CACHE_PREFIXES.L2).toBe("l2:");
    });

    it("should define FREQUENCY prefix", () => {
      expect(CACHE_PREFIXES.FREQUENCY).toBe("freq:");
    });
  });

  describe("TTL_STRATEGY", () => {
    it("should define HOT TTL as 2 hours", () => {
      expect(TTL_STRATEGY.HOT).toBe(2 * 60 * 60);
      expect(TTL_STRATEGY.HOT).toBe(7200);
    });

    it("should define WARM TTL as 1 hour", () => {
      expect(TTL_STRATEGY.WARM).toBe(1 * 60 * 60);
      expect(TTL_STRATEGY.WARM).toBe(3600);
    });

    it("should define COLD TTL as 30 minutes", () => {
      expect(TTL_STRATEGY.COLD).toBe(30 * 60);
      expect(TTL_STRATEGY.COLD).toBe(1800);
    });

    it("should have decreasing TTL values", () => {
      expect(TTL_STRATEGY.HOT).toBeGreaterThan(TTL_STRATEGY.WARM);
      expect(TTL_STRATEGY.WARM).toBeGreaterThan(TTL_STRATEGY.COLD);
    });
  });

  describe("FREQUENCY_THRESHOLDS", () => {
    it("should define HOT threshold as 5", () => {
      expect(FREQUENCY_THRESHOLDS.HOT).toBe(5);
    });

    it("should define WARM threshold as 2", () => {
      expect(FREQUENCY_THRESHOLDS.WARM).toBe(2);
    });

    it("should have HOT threshold greater than WARM", () => {
      expect(FREQUENCY_THRESHOLDS.HOT).toBeGreaterThan(
        FREQUENCY_THRESHOLDS.WARM,
      );
    });
  });

  describe("getAdaptiveTTL", () => {
    it("should return HOT TTL for queries with 5+ hits", async () => {
      mockRedis.zscore = jest.fn().mockResolvedValueOnce(5);

      const ttl = await getAdaptiveTTL("test_cache_key");

      expect(mockRedis.zscore).toHaveBeenCalledWith(
        "freq:queries",
        "test_cache_key",
      );
      expect(ttl).toBe(TTL_STRATEGY.HOT);
      expect(ttl).toBe(7200);
    });

    it("should return HOT TTL for queries with 10+ hits", async () => {
      mockRedis.zscore = jest.fn().mockResolvedValueOnce(10);

      const ttl = await getAdaptiveTTL("popular_query");

      expect(ttl).toBe(TTL_STRATEGY.HOT);
    });

    it("should return WARM TTL for queries with 2-4 hits", async () => {
      mockRedis.zscore = jest.fn().mockResolvedValueOnce(3);

      const ttl = await getAdaptiveTTL("moderate_query");

      expect(ttl).toBe(TTL_STRATEGY.WARM);
      expect(ttl).toBe(3600);
    });

    it("should return WARM TTL for queries with exactly 2 hits", async () => {
      mockRedis.zscore = jest.fn().mockResolvedValueOnce(2);

      const ttl = await getAdaptiveTTL("query");

      expect(ttl).toBe(TTL_STRATEGY.WARM);
    });

    it("should return COLD TTL for queries with 1 hit", async () => {
      mockRedis.zscore = jest.fn().mockResolvedValueOnce(1);

      const ttl = await getAdaptiveTTL("rare_query");

      expect(ttl).toBe(TTL_STRATEGY.COLD);
      expect(ttl).toBe(1800);
    });

    it("should return COLD TTL for queries with no history (null)", async () => {
      mockRedis.zscore = jest.fn().mockResolvedValueOnce(null);

      const ttl = await getAdaptiveTTL("new_query");

      expect(ttl).toBe(TTL_STRATEGY.COLD);
    });

    it("should return COLD TTL for queries with 0 hits", async () => {
      mockRedis.zscore = jest.fn().mockResolvedValueOnce(0);

      const ttl = await getAdaptiveTTL("zero_hits");

      expect(ttl).toBe(TTL_STRATEGY.COLD);
    });

    it("should use correct frequency key format", async () => {
      mockRedis.zscore = jest.fn().mockResolvedValueOnce(3);

      await getAdaptiveTTL("test_key");

      expect(mockRedis.zscore).toHaveBeenCalledWith(
        `${CACHE_PREFIXES.FREQUENCY}queries`,
        "test_key",
      );
    });

    it("should fallback to COLD TTL on Redis error", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      mockRedis.zscore = jest
        .fn()
        .mockRejectedValueOnce(new Error("Redis connection failed"));

      const ttl = await getAdaptiveTTL("error_query");

      expect(ttl).toBe(TTL_STRATEGY.COLD);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "⚠️ Adaptive TTL calculation failed (Redis unavailable):",
        "Redis connection failed",
      );

      consoleWarnSpy.mockRestore();
    });

    it("should handle network timeout errors", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      mockRedis.zscore = jest
        .fn()
        .mockRejectedValueOnce(new Error("Connection timeout"));

      const ttl = await getAdaptiveTTL("timeout_query");

      expect(ttl).toBe(TTL_STRATEGY.COLD);
      consoleWarnSpy.mockRestore();
    });

    it("should handle different cache keys correctly", async () => {
      mockRedis.zscore = jest
        .fn()
        .mockResolvedValueOnce(6)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(1);

      const ttl1 = await getAdaptiveTTL("key1");
      const ttl2 = await getAdaptiveTTL("key2");
      const ttl3 = await getAdaptiveTTL("key3");

      expect(ttl1).toBe(TTL_STRATEGY.HOT);
      expect(ttl2).toBe(TTL_STRATEGY.WARM);
      expect(ttl3).toBe(TTL_STRATEGY.COLD);
      expect(mockRedis.zscore).toHaveBeenCalledTimes(3);
    });
  });

  describe("trackQueryFrequency", () => {
    it("should increment frequency for cache key", async () => {
      mockRedis.zincrby = jest.fn().mockResolvedValueOnce(1);

      await trackQueryFrequency("test_cache_key");

      expect(mockRedis.zincrby).toHaveBeenCalledWith(
        "freq:queries",
        1,
        "test_cache_key",
      );
    });

    it("should use correct frequency key format", async () => {
      mockRedis.zincrby = jest.fn().mockResolvedValueOnce(5);

      await trackQueryFrequency("another_key");

      expect(mockRedis.zincrby).toHaveBeenCalledWith(
        `${CACHE_PREFIXES.FREQUENCY}queries`,
        1,
        "another_key",
      );
    });

    it("should track multiple queries independently", async () => {
      mockRedis.zincrby = jest
        .fn()
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1);

      await trackQueryFrequency("query1");
      await trackQueryFrequency("query2");
      await trackQueryFrequency("query3");

      expect(mockRedis.zincrby).toHaveBeenCalledTimes(3);
      expect(mockRedis.zincrby).toHaveBeenCalledWith(
        "freq:queries",
        1,
        "query1",
      );
      expect(mockRedis.zincrby).toHaveBeenCalledWith(
        "freq:queries",
        1,
        "query2",
      );
      expect(mockRedis.zincrby).toHaveBeenCalledWith(
        "freq:queries",
        1,
        "query3",
      );
    });

    it("should not throw error on Redis failure", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      mockRedis.zincrby = jest
        .fn()
        .mockRejectedValueOnce(new Error("Redis error"));

      await expect(trackQueryFrequency("error_key")).resolves.not.toThrow();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "⚠️ Query frequency tracking failed (Redis unavailable):",
        "Redis error",
      );

      consoleWarnSpy.mockRestore();
    });

    it("should handle network errors gracefully", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      mockRedis.zincrby = jest
        .fn()
        .mockRejectedValueOnce(new Error("Network timeout"));

      await trackQueryFrequency("network_error_key");

      // Should not throw, just log warning
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it("should increment by 1 each time", async () => {
      mockRedis.zincrby = jest.fn().mockResolvedValue(5);

      await trackQueryFrequency("same_key");

      expect(mockRedis.zincrby).toHaveBeenCalledWith(
        "freq:queries",
        1, // Always increments by 1
        "same_key",
      );
    });
  });

  describe("TTL and Frequency integration", () => {
    it("should return appropriate TTL for frequency lifecycle", async () => {
      // New query: no frequency → COLD TTL
      mockRedis.zscore = jest.fn().mockResolvedValueOnce(null);
      expect(await getAdaptiveTTL("new")).toBe(TTL_STRATEGY.COLD);

      // After 1 hit → COLD TTL
      mockRedis.zscore = jest.fn().mockResolvedValueOnce(1);
      expect(await getAdaptiveTTL("new")).toBe(TTL_STRATEGY.COLD);

      // After 2 hits → WARM TTL
      mockRedis.zscore = jest.fn().mockResolvedValueOnce(2);
      expect(await getAdaptiveTTL("new")).toBe(TTL_STRATEGY.WARM);

      // After 5 hits → HOT TTL
      mockRedis.zscore = jest.fn().mockResolvedValueOnce(5);
      expect(await getAdaptiveTTL("new")).toBe(TTL_STRATEGY.HOT);
    });

    it("should demonstrate complete caching workflow", async () => {
      const cacheKey = "workflow_test";

      // Track first query
      mockRedis.zincrby = jest.fn().mockResolvedValueOnce(1);
      await trackQueryFrequency(cacheKey);

      // Check TTL after first query
      mockRedis.zscore = jest.fn().mockResolvedValueOnce(1);
      const ttl1 = await getAdaptiveTTL(cacheKey);
      expect(ttl1).toBe(TTL_STRATEGY.COLD);

      // Track more queries
      mockRedis.zincrby = jest
        .fn()
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(3);
      await trackQueryFrequency(cacheKey);
      await trackQueryFrequency(cacheKey);

      // Check TTL after 3 queries total
      mockRedis.zscore = jest.fn().mockResolvedValueOnce(3);
      const ttl2 = await getAdaptiveTTL(cacheKey);
      expect(ttl2).toBe(TTL_STRATEGY.WARM);
    });
  });
});
