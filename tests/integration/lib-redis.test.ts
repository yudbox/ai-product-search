/**
 * Integration tests for lib/redis
 * Testing dockerRedisClient.ts, vercelKvClient.ts, and index.ts
 */

import { DockerRedisClient } from "@/lib/redis/dockerRedisClient";
import { VercelKvClient } from "@/lib/redis/vercelKvClient";
import { Redis } from "ioredis";
import { kv } from "@vercel/kv";

// Mock ioredis
jest.mock("ioredis", () => {
  return {
    Redis: jest.fn().mockImplementation(() => ({
      get: jest.fn(),
      set: jest.fn(),
      setex: jest.fn(),
      zincrby: jest.fn(),
      zscore: jest.fn(),
      zrange: jest.fn(),
      zrevrange: jest.fn(),
      zcard: jest.fn(),
      quit: jest.fn(),
      on: jest.fn(),
    })),
  };
});

// Mock @vercel/kv
jest.mock("@vercel/kv", () => ({
  kv: {
    get: jest.fn(),
    set: jest.fn(),
    zincrby: jest.fn(),
    zscore: jest.fn(),
    zrange: jest.fn(),
    zcard: jest.fn(),
  },
}));

const MockedRedis = jest.mocked(Redis);
const mockedKv = jest.mocked(kv);

describe("Integration: lib/redis/dockerRedisClient", () => {
  let client: DockerRedisClient;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockRedisInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new DockerRedisClient();
    mockRedisInstance =
      MockedRedis.mock.results[MockedRedis.mock.results.length - 1].value;
  });

  describe("constructor", () => {
    it("should create client with default URL", () => {
      expect(MockedRedis).toHaveBeenCalledWith("redis://localhost:6379");
    });

    it("should create client with custom URL", () => {
      MockedRedis.mockClear();
      new DockerRedisClient("redis://custom:6380");
      expect(MockedRedis).toHaveBeenCalledWith("redis://custom:6380");
    });

    it("should use REDIS_URL from environment", () => {
      const originalEnv = process.env.REDIS_URL;
      process.env.REDIS_URL = "redis://env:6381";
      MockedRedis.mockClear();
      new DockerRedisClient();
      expect(MockedRedis).toHaveBeenCalledWith("redis://env:6381");
      if (originalEnv) {
        process.env.REDIS_URL = originalEnv;
      } else {
        delete process.env.REDIS_URL;
      }
    });

    it("should register connect event handler", () => {
      expect(mockRedisInstance.on).toHaveBeenCalledWith(
        "connect",
        expect.any(Function),
      );
    });

    it("should register error event handler", () => {
      expect(mockRedisInstance.on).toHaveBeenCalledWith(
        "error",
        expect.any(Function),
      );
    });
  });

  describe("get", () => {
    it("should get and parse JSON value", async () => {
      const testData = { name: "test" };
      mockRedisInstance.get.mockResolvedValue(JSON.stringify(testData));

      const result = await client.get("key1");

      expect(mockRedisInstance.get).toHaveBeenCalledWith("key1");
      expect(result).toEqual(testData);
    });

    it("should return null for non-existent key", async () => {
      mockRedisInstance.get.mockResolvedValue(null);

      const result = await client.get("nonexistent");

      expect(result).toBeNull();
    });

    it("should return string value if JSON parse fails", async () => {
      mockRedisInstance.get.mockResolvedValue("plain string");

      const result = await client.get("key2");

      expect(result).toBe("plain string");
    });

    it("should handle complex objects", async () => {
      const complexData = {
        array: [1, 2, 3],
        nested: { prop: "value" },
      };
      mockRedisInstance.get.mockResolvedValue(JSON.stringify(complexData));

      const result = await client.get("complex");

      expect(result).toEqual(complexData);
    });
  });

  describe("set", () => {
    it("should set string value without TTL", async () => {
      await client.set("key1", "value1");

      expect(mockRedisInstance.set).toHaveBeenCalledWith("key1", "value1");
      expect(mockRedisInstance.setex).not.toHaveBeenCalled();
    });

    it("should set object value without TTL", async () => {
      const obj = { name: "test" };
      await client.set("key2", obj);

      expect(mockRedisInstance.set).toHaveBeenCalledWith(
        "key2",
        JSON.stringify(obj),
      );
    });

    it("should set value with TTL", async () => {
      await client.set("key3", "value3", { ex: 3600 });

      expect(mockRedisInstance.setex).toHaveBeenCalledWith(
        "key3",
        3600,
        "value3",
      );
      expect(mockRedisInstance.set).not.toHaveBeenCalled();
    });

    it("should set object with TTL", async () => {
      const obj = { data: "test" };
      await client.set("key4", obj, { ex: 7200 });

      expect(mockRedisInstance.setex).toHaveBeenCalledWith(
        "key4",
        7200,
        JSON.stringify(obj),
      );
    });

    it("should handle number values", async () => {
      await client.set("number", 42);

      expect(mockRedisInstance.set).toHaveBeenCalledWith("number", "42");
    });

    it("should handle boolean values", async () => {
      await client.set("bool", true);

      expect(mockRedisInstance.set).toHaveBeenCalledWith("bool", "true");
    });
  });

  describe("zincrby", () => {
    it("should increment score in sorted set", async () => {
      mockRedisInstance.zincrby.mockResolvedValue("5");

      const result = await client.zincrby("leaderboard", 1, "player1");

      expect(mockRedisInstance.zincrby).toHaveBeenCalledWith(
        "leaderboard",
        1,
        "player1",
      );
      expect(result).toBe("5");
    });

    it("should handle decimal increments", async () => {
      mockRedisInstance.zincrby.mockResolvedValue("10.5");

      const result = await client.zincrby("scores", 2.5, "user1");

      expect(mockRedisInstance.zincrby).toHaveBeenCalledWith(
        "scores",
        2.5,
        "user1",
      );
      expect(result).toBe("10.5");
    });

    it("should handle negative increments", async () => {
      mockRedisInstance.zincrby.mockResolvedValue("3");

      const result = await client.zincrby("counter", -2, "item1");

      expect(mockRedisInstance.zincrby).toHaveBeenCalledWith(
        "counter",
        -2,
        "item1",
      );
      expect(result).toBe("3");
    });
  });

  describe("zscore", () => {
    it("should get score from sorted set", async () => {
      mockRedisInstance.zscore.mockResolvedValue("42");

      const result = await client.zscore("leaderboard", "player1");

      expect(mockRedisInstance.zscore).toHaveBeenCalledWith(
        "leaderboard",
        "player1",
      );
      expect(result).toBe(42);
    });

    it("should return null for non-existent member", async () => {
      mockRedisInstance.zscore.mockResolvedValue(null);

      const result = await client.zscore("leaderboard", "unknown");

      expect(result).toBeNull();
    });

    it("should parse decimal scores", async () => {
      mockRedisInstance.zscore.mockResolvedValue("99.5");

      const result = await client.zscore("scores", "user1");

      expect(result).toBe(99.5);
    });
  });

  describe("zrange", () => {
    it("should get range without options", async () => {
      mockRedisInstance.zrange.mockResolvedValue(["member1", "member2"]);

      const result = await client.zrange("set1", 0, 10);

      expect(mockRedisInstance.zrange).toHaveBeenCalledWith("set1", 0, 10);
      expect(result).toEqual(["member1", "member2"]);
    });

    it("should get range with scores", async () => {
      mockRedisInstance.zrange.mockResolvedValue([
        "member1",
        "10",
        "member2",
        "20",
      ]);

      const result = await client.zrange("set1", 0, 10, { withScores: true });

      expect(mockRedisInstance.zrange).toHaveBeenCalledWith(
        "set1",
        0,
        10,
        "WITHSCORES",
      );
      expect(result).toEqual(["member1", "10", "member2", "20"]);
    });

    it("should get reverse range", async () => {
      mockRedisInstance.zrevrange.mockResolvedValue(["member2", "member1"]);

      const result = await client.zrange("set1", 0, 10, { rev: true });

      expect(mockRedisInstance.zrevrange).toHaveBeenCalledWith("set1", 0, 10);
      expect(result).toEqual(["member2", "member1"]);
    });

    it("should get reverse range with scores", async () => {
      mockRedisInstance.zrevrange.mockResolvedValue([
        "member2",
        "20",
        "member1",
        "10",
      ]);

      const result = await client.zrange("set1", 0, 10, {
        rev: true,
        withScores: true,
      });

      expect(mockRedisInstance.zrevrange).toHaveBeenCalledWith(
        "set1",
        0,
        10,
        "WITHSCORES",
      );
      expect(result).toEqual(["member2", "20", "member1", "10"]);
    });
  });

  describe("zcard", () => {
    it("should get cardinality of sorted set", async () => {
      mockRedisInstance.zcard.mockResolvedValue(42);

      const result = await client.zcard("leaderboard");

      expect(mockRedisInstance.zcard).toHaveBeenCalledWith("leaderboard");
      expect(result).toBe(42);
    });

    it("should return 0 for empty set", async () => {
      mockRedisInstance.zcard.mockResolvedValue(0);

      const result = await client.zcard("empty");

      expect(result).toBe(0);
    });
  });

  describe("disconnect", () => {
    it("should disconnect from Redis", async () => {
      await client.disconnect();

      expect(mockRedisInstance.quit).toHaveBeenCalled();
    });
  });

  describe("error handling and graceful degradation", () => {
    it("should handle connection errors gracefully", () => {
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      // Create new instance to trigger connect event
      MockedRedis.mockClear();
      new DockerRedisClient(); // Create instance to trigger event handlers
      const instance =
        MockedRedis.mock.results[MockedRedis.mock.results.length - 1].value;

      // Simulate connect event
      const connectHandler = instance.on.mock.calls.find(
        (call: [string, () => void]) => call[0] === "connect",
      )?.[1];
      connectHandler?.();

      expect(consoleLogSpy).toHaveBeenCalledWith("✅ Docker Redis connected");

      // Simulate error event
      const errorHandler = instance.on.mock.calls.find(
        (call: [string, (error: Error) => void]) => call[0] === "error",
      )?.[1];
      errorHandler?.(new Error("Connection lost"));

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "⚠️ Docker Redis connection error:",
        "Connection lost",
      );

      consoleLogSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it("should handle GET errors gracefully", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      mockRedisInstance.get.mockRejectedValue(new Error("Redis GET failed"));

      const result = await client.get("error_key");

      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ Docker Redis GET failed for key "error_key":',
        "Redis GET failed",
      );

      consoleWarnSpy.mockRestore();
    });

    it("should handle SET errors gracefully", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      mockRedisInstance.set.mockRejectedValue(new Error("Redis SET failed"));

      await expect(client.set("error_key", "value")).resolves.not.toThrow();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ Docker Redis SET failed for key "error_key":',
        "Redis SET failed",
      );

      consoleWarnSpy.mockRestore();
    });

    it("should handle ZINCRBY errors gracefully", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      mockRedisInstance.zincrby.mockRejectedValue(
        new Error("Redis ZINCRBY failed"),
      );

      const result = await client.zincrby("error_set", 1, "member");

      expect(result).toBe("0");
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ Docker Redis ZINCRBY failed for key "error_set":',
        "Redis ZINCRBY failed",
      );

      consoleWarnSpy.mockRestore();
    });

    it("should handle ZSCORE errors gracefully", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      mockRedisInstance.zscore.mockRejectedValue(
        new Error("Redis ZSCORE failed"),
      );

      const result = await client.zscore("error_set", "member");

      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ Docker Redis ZSCORE failed for key "error_set":',
        "Redis ZSCORE failed",
      );

      consoleWarnSpy.mockRestore();
    });

    it("should handle ZRANGE errors gracefully", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      mockRedisInstance.zrange.mockRejectedValue(
        new Error("Redis ZRANGE failed"),
      );

      const result = await client.zrange("error_set", 0, 10);

      expect(result).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ Docker Redis ZRANGE failed for key "error_set":',
        "Redis ZRANGE failed",
      );

      consoleWarnSpy.mockRestore();
    });

    it("should handle ZCARD errors gracefully", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      mockRedisInstance.zcard.mockRejectedValue(
        new Error("Redis ZCARD failed"),
      );

      const result = await client.zcard("error_set");

      expect(result).toBe(0);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ Docker Redis ZCARD failed for key "error_set":',
        "Redis ZCARD failed",
      );

      consoleWarnSpy.mockRestore();
    });

    it("should handle DISCONNECT errors gracefully", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      mockRedisInstance.quit.mockRejectedValue(
        new Error("Already disconnected"),
      );

      await expect(client.disconnect()).resolves.not.toThrow();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "⚠️ Docker Redis DISCONNECT failed:",
        "Already disconnected",
      );

      consoleWarnSpy.mockRestore();
    });
  });
});

describe("Integration: lib/redis/vercelKvClient", () => {
  let client: VercelKvClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new VercelKvClient();
  });

  describe("get", () => {
    it("should get value from Vercel KV", async () => {
      const testData = { name: "test" };
      mockedKv.get.mockResolvedValue(testData);

      const result = await client.get("key1");

      expect(mockedKv.get).toHaveBeenCalledWith("key1");
      expect(result).toEqual(testData);
    });

    it("should return null for non-existent key", async () => {
      mockedKv.get.mockResolvedValue(null);

      const result = await client.get("nonexistent");

      expect(result).toBeNull();
    });

    it("should handle string values", async () => {
      mockedKv.get.mockResolvedValue("string value");

      const result = await client.get("key2");

      expect(result).toBe("string value");
    });
  });

  describe("set", () => {
    it("should set value without TTL", async () => {
      await client.set("key1", "value1");

      expect(mockedKv.set).toHaveBeenCalledWith("key1", "value1");
    });

    it("should set value with TTL", async () => {
      await client.set("key2", "value2", { ex: 3600 });

      expect(mockedKv.set).toHaveBeenCalledWith("key2", "value2", { ex: 3600 });
    });

    it("should set object value", async () => {
      const obj = { data: "test" };
      await client.set("key3", obj);

      expect(mockedKv.set).toHaveBeenCalledWith("key3", obj);
    });

    it("should set number value", async () => {
      await client.set("number", 42);

      expect(mockedKv.set).toHaveBeenCalledWith("number", 42);
    });
  });

  describe("zincrby", () => {
    it("should increment score in sorted set", async () => {
      mockedKv.zincrby.mockResolvedValue(5);

      const result = await client.zincrby("leaderboard", 1, "player1");

      expect(mockedKv.zincrby).toHaveBeenCalledWith(
        "leaderboard",
        1,
        "player1",
      );
      expect(result).toBe(5);
    });

    it("should handle decimal increments", async () => {
      mockedKv.zincrby.mockResolvedValue(10.5);

      const result = await client.zincrby("scores", 2.5, "user1");

      expect(result).toBe(10.5);
    });
  });

  describe("zscore", () => {
    it("should get score from sorted set", async () => {
      mockedKv.zscore.mockResolvedValue(42);

      const result = await client.zscore("leaderboard", "player1");

      expect(mockedKv.zscore).toHaveBeenCalledWith("leaderboard", "player1");
      expect(result).toBe(42);
    });

    it("should return null for non-existent member", async () => {
      mockedKv.zscore.mockResolvedValue(null);

      const result = await client.zscore("leaderboard", "unknown");

      expect(result).toBeNull();
    });
  });

  describe("zrange", () => {
    it("should get range from sorted set", async () => {
      mockedKv.zrange.mockResolvedValue(["member1", "member2"]);

      const result = await client.zrange("set1", 0, 10);

      expect(mockedKv.zrange).toHaveBeenCalledWith("set1", 0, 10, undefined);
      expect(result).toEqual(["member1", "member2"]);
    });

    it("should get range with options", async () => {
      const opts = { rev: true, withScores: true };
      mockedKv.zrange.mockResolvedValue(["member2", 20, "member1", 10]);

      const result = await client.zrange("set1", 0, 10, opts);

      expect(mockedKv.zrange).toHaveBeenCalledWith("set1", 0, 10, opts);
      expect(result).toEqual(["member2", 20, "member1", 10]);
    });
  });

  describe("zcard", () => {
    it("should get cardinality of sorted set", async () => {
      mockedKv.zcard.mockResolvedValue(42);

      const result = await client.zcard("leaderboard");

      expect(mockedKv.zcard).toHaveBeenCalledWith("leaderboard");
      expect(result).toBe(42);
    });
  });

  describe("error handling and graceful degradation", () => {
    it("should handle GET errors gracefully", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      mockedKv.get.mockRejectedValue(new Error("KV connection failed"));

      const result = await client.get("test_key");

      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ Vercel KV GET failed for key "test_key":',
        "KV connection failed",
      );
      consoleWarnSpy.mockRestore();
    });

    it("should handle SET errors gracefully", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      mockedKv.set.mockRejectedValue(new Error("KV connection failed"));

      await expect(client.set("test_key", "value")).resolves.not.toThrow();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ Vercel KV SET failed for key "test_key":',
        "KV connection failed",
      );
      consoleWarnSpy.mockRestore();
    });

    it("should handle SET with TTL errors gracefully", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      mockedKv.set.mockRejectedValue(new Error("KV connection failed"));

      await expect(
        client.set("test_key", "value", { ex: 3600 }),
      ).resolves.not.toThrow();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ Vercel KV SET failed for key "test_key":',
        "KV connection failed",
      );
      consoleWarnSpy.mockRestore();
    });

    it("should handle ZINCRBY errors gracefully", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      mockedKv.zincrby.mockRejectedValue(new Error("KV connection failed"));

      const result = await client.zincrby("leaderboard", 1, "player1");

      expect(result).toBe(0);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ Vercel KV ZINCRBY failed for key "leaderboard":',
        "KV connection failed",
      );
      consoleWarnSpy.mockRestore();
    });

    it("should handle ZSCORE errors gracefully", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      mockedKv.zscore.mockRejectedValue(new Error("KV connection failed"));

      const result = await client.zscore("leaderboard", "player1");

      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ Vercel KV ZSCORE failed for key "leaderboard":',
        "KV connection failed",
      );
      consoleWarnSpy.mockRestore();
    });

    it("should handle ZRANGE errors gracefully", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      mockedKv.zrange.mockRejectedValue(new Error("KV connection failed"));

      const result = await client.zrange("leaderboard", 0, 10);

      expect(result).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ Vercel KV ZRANGE failed for key "leaderboard":',
        "KV connection failed",
      );
      consoleWarnSpy.mockRestore();
    });

    it("should handle ZCARD errors gracefully", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      mockedKv.zcard.mockRejectedValue(new Error("KV connection failed"));

      const result = await client.zcard("leaderboard");

      expect(result).toBe(0);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ Vercel KV ZCARD failed for key "leaderboard":',
        "KV connection failed",
      );
      consoleWarnSpy.mockRestore();
    });
  });
});

describe("Integration: lib/redis/index", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("redis factory", () => {
    it("should create DockerRedisClient in development", async () => {
      delete process.env.VERCEL;
      delete process.env.KV_REST_API_URL;
      Object.defineProperty(process.env, "NODE_ENV", {
        value: "development",
        writable: true,
      });

      const { redis } = await import("@/lib/redis");

      expect(redis).toBeDefined();
    });

    it("should create VercelKvClient when VERCEL=1", async () => {
      process.env.VERCEL = "1";

      const { redis } = await import("@/lib/redis");

      expect(redis).toBeDefined();
    });

    it("should create VercelKvClient when KV_REST_API_URL exists", async () => {
      delete process.env.VERCEL;
      process.env.KV_REST_API_URL = "https://example.com";
      Object.defineProperty(process.env, "NODE_ENV", {
        value: "development",
        writable: true,
      });

      const { redis } = await import("@/lib/redis");

      expect(redis).toBeDefined();
    });

    it("should create VercelKvClient in production", async () => {
      delete process.env.VERCEL;
      delete process.env.KV_REST_API_URL;
      Object.defineProperty(process.env, "NODE_ENV", {
        value: "production",
        writable: true,
      });

      const { redis } = await import("@/lib/redis");

      expect(redis).toBeDefined();
    });
  });

  describe("CACHE_PREFIXES", () => {
    it("should export cache prefixes", async () => {
      const { CACHE_PREFIXES } = await import("@/lib/redis");

      expect(CACHE_PREFIXES.L1).toBe("l1:");
      expect(CACHE_PREFIXES.L2).toBe("l2:");
      expect(CACHE_PREFIXES.FREQUENCY).toBe("freq:");
    });
  });

  describe("TTL_STRATEGY", () => {
    it("should export TTL strategies", async () => {
      const { TTL_STRATEGY } = await import("@/lib/redis");

      expect(TTL_STRATEGY.HOT).toBe(2 * 60 * 60);
      expect(TTL_STRATEGY.WARM).toBe(1 * 60 * 60);
      expect(TTL_STRATEGY.COLD).toBe(30 * 60);
    });
  });

  describe("FREQUENCY_THRESHOLDS", () => {
    it("should export frequency thresholds", async () => {
      const { FREQUENCY_THRESHOLDS } = await import("@/lib/redis");

      expect(FREQUENCY_THRESHOLDS.HOT).toBe(5);
      expect(FREQUENCY_THRESHOLDS.WARM).toBe(2);
    });
  });

  describe("getAdaptiveTTL", () => {
    let zscoreSpy: jest.SpyInstance;
    let getAdaptiveTTL: (cacheKey: string) => Promise<number>;
    let TTL_STRATEGY: { HOT: number; WARM: number; COLD: number };

    beforeAll(async () => {
      const redisModule = await import("@/lib/redis");
      zscoreSpy = jest.spyOn(redisModule.redis, "zscore");
      getAdaptiveTTL = redisModule.getAdaptiveTTL;
      TTL_STRATEGY = redisModule.TTL_STRATEGY;
    });

    beforeEach(() => {
      zscoreSpy.mockClear();
    });

    afterAll(() => {
      if (zscoreSpy) {
        zscoreSpy.mockRestore();
      }
    });

    it("should return HOT TTL for popular queries", async () => {
      zscoreSpy.mockResolvedValue(10);

      const ttl = await getAdaptiveTTL("popular-query");

      expect(ttl).toBe(TTL_STRATEGY.HOT);
    });

    it("should return WARM TTL for moderate queries", async () => {
      zscoreSpy.mockResolvedValue(3);

      const ttl = await getAdaptiveTTL("moderate-query");

      expect(ttl).toBe(TTL_STRATEGY.WARM);
    });

    it("should return COLD TTL for rare queries", async () => {
      zscoreSpy.mockResolvedValue(1);

      const ttl = await getAdaptiveTTL("rare-query");

      expect(ttl).toBe(TTL_STRATEGY.COLD);
    });

    it("should return COLD TTL for new queries", async () => {
      zscoreSpy.mockResolvedValue(null);

      const ttl = await getAdaptiveTTL("new-query");

      expect(ttl).toBe(TTL_STRATEGY.COLD);
    });

    it("should return COLD TTL on error", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      zscoreSpy.mockRejectedValue(new Error("Redis error"));

      const ttl = await getAdaptiveTTL("error-query");

      expect(ttl).toBe(TTL_STRATEGY.COLD);
      // Console.warn comes from getAdaptiveTTL when Redis fails
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "⚠️ Adaptive TTL calculation failed (Redis unavailable):",
        "Redis error",
      );
      consoleWarnSpy.mockRestore();
    });

    it("should handle exact threshold boundaries", async () => {
      zscoreSpy.mockResolvedValue(5);

      const ttl = await getAdaptiveTTL("boundary-query");

      expect(ttl).toBe(TTL_STRATEGY.HOT);
    });

    it("should handle WARM threshold boundary", async () => {
      zscoreSpy.mockResolvedValue(2);

      const ttl = await getAdaptiveTTL("warm-boundary");

      expect(ttl).toBe(TTL_STRATEGY.WARM);
    });
  });

  describe("trackQueryFrequency", () => {
    let zincrbySpy: jest.SpyInstance;
    let trackQueryFrequency: (cacheKey: string) => Promise<void>;

    beforeAll(async () => {
      const redisModule = await import("@/lib/redis");
      zincrbySpy = jest.spyOn(redisModule.redis, "zincrby");
      trackQueryFrequency = redisModule.trackQueryFrequency;
    });

    beforeEach(() => {
      zincrbySpy.mockClear();
    });

    afterAll(() => {
      if (zincrbySpy) {
        zincrbySpy.mockRestore();
      }
    });

    it("should increment query frequency counter", async () => {
      zincrbySpy.mockResolvedValue(1);

      await trackQueryFrequency("test-query");

      expect(zincrbySpy).toHaveBeenCalledWith("freq:queries", 1, "test-query");
    });

    it("should not throw on error", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      zincrbySpy.mockRejectedValue(new Error("Redis error"));

      await expect(trackQueryFrequency("error-query")).resolves.toBeUndefined();

      // Console.warn comes from trackQueryFrequency when Redis fails
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "⚠️ Query frequency tracking failed (Redis unavailable):",
        "Redis error",
      );
      consoleWarnSpy.mockRestore();
    });

    it("should track multiple queries", async () => {
      zincrbySpy.mockResolvedValue(1);

      await trackQueryFrequency("query1");
      await trackQueryFrequency("query2");
      await trackQueryFrequency("query1");

      expect(zincrbySpy).toHaveBeenCalledTimes(3);
    });
  });
});
