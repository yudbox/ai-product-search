/**
 * Unit tests for Docker Redis Client
 */

// Mock ioredis BEFORE importing
const mockRedis = {
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
};

jest.mock("ioredis", () => {
  return {
    Redis: jest.fn().mockImplementation(() => mockRedis),
  };
});

import { DockerRedisClient } from "../dockerRedisClient";
import { Redis } from "ioredis";

describe("DockerRedisClient", () => {
  let client: DockerRedisClient;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe("constructor", () => {
    it("should use default Redis URL", () => {
      client = new DockerRedisClient();

      expect(Redis).toHaveBeenCalledWith("redis://localhost:6379");
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "🐳 Connecting to Docker Redis:",
        "redis://localhost:6379",
      );
    });

    it("should use provided URL", () => {
      client = new DockerRedisClient("redis://custom:6380");

      expect(Redis).toHaveBeenCalledWith("redis://custom:6380");
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "🐳 Connecting to Docker Redis:",
        "redis://custom:6380",
      );
    });

    it("should use REDIS_URL environment variable", () => {
      const originalRedisUrl = process.env.REDIS_URL;
      process.env.REDIS_URL = "redis://env:6379";

      client = new DockerRedisClient();

      expect(Redis).toHaveBeenCalledWith("redis://env:6379");

      // Restore
      if (originalRedisUrl) {
        process.env.REDIS_URL = originalRedisUrl;
      } else {
        delete process.env.REDIS_URL;
      }
    });

    it("should register event listeners", () => {
      client = new DockerRedisClient();

      expect(mockRedis.on).toHaveBeenCalledWith(
        "connect",
        expect.any(Function),
      );
      expect(mockRedis.on).toHaveBeenCalledWith("error", expect.any(Function));
    });

    it("should log on connect event", () => {
      client = new DockerRedisClient();

      // Get the connect handler
      const connectHandler = mockRedis.on.mock.calls.find(
        (call) => call[0] === "connect",
      )?.[1];

      // Trigger connect event
      connectHandler?.();

      expect(consoleLogSpy).toHaveBeenCalledWith("✅ Docker Redis connected");
    });

    it("should log on error event", () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      client = new DockerRedisClient();

      // Get the error handler
      const errorHandler = mockRedis.on.mock.calls.find(
        (call) => call[0] === "error",
      )?.[1];

      // Trigger error event
      errorHandler?.(new Error("Connection refused"));

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "⚠️ Docker Redis connection error:",
        "Connection refused",
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe("get", () => {
    beforeEach(() => {
      client = new DockerRedisClient();
    });

    it("should get and parse JSON value", async () => {
      const mockValue = { name: "test", count: 42 };
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(mockValue));

      const result = await client.get("test_key");

      expect(mockRedis.get).toHaveBeenCalledWith("test_key");
      expect(result).toEqual(mockValue);
    });

    it("should return null for non-existent key", async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      const result = await client.get("nonexistent");

      expect(result).toBeNull();
    });

    it("should return string value as-is when JSON parse fails", async () => {
      mockRedis.get.mockResolvedValueOnce("plain string");

      const result = await client.get<string>("string_key");

      expect(result).toBe("plain string");
    });

    it("should parse different JSON types", async () => {
      // Array
      mockRedis.get.mockResolvedValueOnce(JSON.stringify([1, 2, 3]));
      await expect(client.get<number[]>("array")).resolves.toEqual([1, 2, 3]);

      // Number
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(123));
      await expect(client.get<number>("number")).resolves.toBe(123);

      // Boolean
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(true));
      await expect(client.get<boolean>("bool")).resolves.toBe(true);

      // Nested object
      const nested = { a: { b: { c: 1 } } };
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(nested));
      await expect(client.get<typeof nested>("nested")).resolves.toEqual(
        nested,
      );
    });

    it("should return empty string when value is empty", async () => {
      mockRedis.get.mockResolvedValueOnce("");

      const result = await client.get("empty");

      expect(result).toBeNull();
    });

    it("should handle errors from Redis", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      mockRedis.get.mockRejectedValueOnce(new Error("Connection lost"));

      const result = await client.get("key");

      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ Docker Redis GET failed for key "key":',
        "Connection lost",
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe("set", () => {
    beforeEach(() => {
      client = new DockerRedisClient();
    });

    it("should set string value without expiration", async () => {
      mockRedis.set.mockResolvedValueOnce("OK");

      await client.set("key", "value");

      expect(mockRedis.set).toHaveBeenCalledWith("key", "value");
    });

    it("should set object value serializing to JSON", async () => {
      mockRedis.set.mockResolvedValueOnce("OK");
      const obj = { test: true, count: 5 };

      await client.set("key", obj);

      expect(mockRedis.set).toHaveBeenCalledWith("key", JSON.stringify(obj));
    });

    it("should set value with expiration", async () => {
      mockRedis.setex.mockResolvedValueOnce("OK");

      await client.set("key", "value", { ex: 3600 });

      expect(mockRedis.setex).toHaveBeenCalledWith("key", 3600, "value");
      expect(mockRedis.set).not.toHaveBeenCalled();
    });

    it("should set object with expiration", async () => {
      mockRedis.setex.mockResolvedValueOnce("OK");
      const obj = { data: "test" };

      await client.set("key", obj, { ex: 1800 });

      expect(mockRedis.setex).toHaveBeenCalledWith(
        "key",
        1800,
        JSON.stringify(obj),
      );
    });

    it("should set different data types", async () => {
      mockRedis.set.mockResolvedValue("OK");

      // Number
      await client.set("num", 123);
      expect(mockRedis.set).toHaveBeenCalledWith("num", JSON.stringify(123));

      // Array
      await client.set("arr", [1, 2, 3]);
      expect(mockRedis.set).toHaveBeenCalledWith(
        "arr",
        JSON.stringify([1, 2, 3]),
      );

      // Boolean
      await client.set("bool", false);
      expect(mockRedis.set).toHaveBeenCalledWith("bool", JSON.stringify(false));
    });

    it("should handle zero expiration as no expiration", async () => {
      mockRedis.set.mockResolvedValueOnce("OK");

      await client.set("key", "value", { ex: 0 });

      expect(mockRedis.set).toHaveBeenCalledWith("key", "value");
      expect(mockRedis.setex).not.toHaveBeenCalled();
    });

    it("should handle errors from Redis", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      mockRedis.set.mockRejectedValueOnce(new Error("Write failed"));

      await expect(client.set("key", "value")).resolves.not.toThrow();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ Docker Redis SET failed for key "key":',
        "Write failed",
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe("zincrby", () => {
    beforeEach(() => {
      client = new DockerRedisClient();
    });

    it("should increment sorted set member", async () => {
      mockRedis.zincrby.mockResolvedValueOnce("5");

      const result = await client.zincrby("freq:queries", 1, "search");

      expect(mockRedis.zincrby).toHaveBeenCalledWith(
        "freq:queries",
        1,
        "search",
      );
      expect(result).toBe("5");
    });

    it("should handle negative increments", async () => {
      mockRedis.zincrby.mockResolvedValueOnce("3");

      const result = await client.zincrby("scores", -2, "user");

      expect(mockRedis.zincrby).toHaveBeenCalledWith("scores", -2, "user");
      expect(result).toBe("3");
    });

    it("should handle first increment", async () => {
      mockRedis.zincrby.mockResolvedValueOnce("1");

      const result = await client.zincrby("new_set", 1, "member");

      expect(result).toBe("1");
    });

    it("should handle errors from Redis", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      mockRedis.zincrby.mockRejectedValueOnce(new Error("Zincrby failed"));

      const result = await client.zincrby("set", 1, "member");

      expect(result).toBe("0");
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ Docker Redis ZINCRBY failed for key "set":',
        "Zincrby failed",
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe("zscore", () => {
    beforeEach(() => {
      client = new DockerRedisClient();
    });

    it("should get score and parse to number", async () => {
      mockRedis.zscore.mockResolvedValueOnce("10.5");

      const result = await client.zscore("freq:queries", "search");

      expect(mockRedis.zscore).toHaveBeenCalledWith("freq:queries", "search");
      expect(result).toBe(10.5);
    });

    it("should return null for non-existent member", async () => {
      mockRedis.zscore.mockResolvedValueOnce(null);

      const result = await client.zscore("set", "nonexistent");

      expect(result).toBeNull();
    });

    it("should handle zero score", async () => {
      mockRedis.zscore.mockResolvedValueOnce("0");

      const result = await client.zscore("set", "member");

      expect(result).toBe(0);
    });

    it("should handle integer scores", async () => {
      mockRedis.zscore.mockResolvedValueOnce("42");

      const result = await client.zscore("set", "member");

      expect(result).toBe(42);
    });

    it("should handle decimal scores", async () => {
      mockRedis.zscore.mockResolvedValueOnce("3.14159");

      const result = await client.zscore("set", "member");

      expect(result).toBe(3.14159);
    });

    it("should handle errors from Redis", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      mockRedis.zscore.mockRejectedValueOnce(new Error("Zscore failed"));

      const result = await client.zscore("set", "member");

      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ Docker Redis ZSCORE failed for key "set":',
        "Zscore failed",
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe("zrange", () => {
    beforeEach(() => {
      client = new DockerRedisClient();
    });

    it("should get range without options", async () => {
      mockRedis.zrange.mockResolvedValueOnce(["m1", "m2", "m3"]);

      const result = await client.zrange("leaderboard", 0, 2);

      expect(mockRedis.zrange).toHaveBeenCalledWith("leaderboard", 0, 2);
      expect(result).toEqual(["m1", "m2", "m3"]);
    });

    it("should get range with withScores option", async () => {
      mockRedis.zrange.mockResolvedValueOnce(["m1", "10", "m2", "20"]);

      const result = await client.zrange("scores", 0, 1, { withScores: true });

      expect(mockRedis.zrange).toHaveBeenCalledWith(
        "scores",
        0,
        1,
        "WITHSCORES",
      );
      expect(result).toEqual(["m1", "10", "m2", "20"]);
    });

    it("should get reverse range without scores", async () => {
      mockRedis.zrevrange.mockResolvedValueOnce(["top", "second"]);

      const result = await client.zrange("scores", 0, 1, { rev: true });

      expect(mockRedis.zrevrange).toHaveBeenCalledWith("scores", 0, 1);
      expect(result).toEqual(["top", "second"]);
    });

    it("should get reverse range with scores", async () => {
      mockRedis.zrevrange.mockResolvedValueOnce(["top", "100", "second", "90"]);

      const result = await client.zrange("scores", 0, 1, {
        rev: true,
        withScores: true,
      });

      expect(mockRedis.zrevrange).toHaveBeenCalledWith(
        "scores",
        0,
        1,
        "WITHSCORES",
      );
      expect(result).toEqual(["top", "100", "second", "90"]);
    });

    it("should handle negative indices", async () => {
      mockRedis.zrange.mockResolvedValueOnce(["last"]);

      const result = await client.zrange("set", -1, -1);

      expect(mockRedis.zrange).toHaveBeenCalledWith("set", -1, -1);
      expect(result).toEqual(["last"]);
    });

    it("should handle empty range", async () => {
      mockRedis.zrange.mockResolvedValueOnce([]);

      const result = await client.zrange("empty", 0, 10);

      expect(result).toEqual([]);
    });

    it("should handle errors from Redis", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      mockRedis.zrange.mockRejectedValueOnce(new Error("Zrange failed"));

      const result = await client.zrange("set", 0, 10);

      expect(result).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ Docker Redis ZRANGE failed for key "set":',
        "Zrange failed",
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe("zcard", () => {
    beforeEach(() => {
      client = new DockerRedisClient();
    });

    it("should get cardinality of sorted set", async () => {
      mockRedis.zcard.mockResolvedValueOnce(42);

      const result = await client.zcard("leaderboard");

      expect(mockRedis.zcard).toHaveBeenCalledWith("leaderboard");
      expect(result).toBe(42);
    });

    it("should return 0 for empty set", async () => {
      mockRedis.zcard.mockResolvedValueOnce(0);

      const result = await client.zcard("empty");

      expect(result).toBe(0);
    });

    it("should handle large cardinalities", async () => {
      mockRedis.zcard.mockResolvedValueOnce(1000000);

      const result = await client.zcard("huge_set");

      expect(result).toBe(1000000);
    });

    it("should handle errors from Redis", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      mockRedis.zcard.mockRejectedValueOnce(new Error("Zcard failed"));

      const result = await client.zcard("set");

      expect(result).toBe(0);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ Docker Redis ZCARD failed for key "set":',
        "Zcard failed",
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe("disconnect", () => {
    beforeEach(() => {
      client = new DockerRedisClient();
    });

    it("should disconnect from Redis", async () => {
      mockRedis.quit.mockResolvedValueOnce("OK");

      await client.disconnect();

      expect(mockRedis.quit).toHaveBeenCalled();
    });

    it("should handle disconnect errors", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      mockRedis.quit.mockRejectedValueOnce(new Error("Already disconnected"));

      await expect(client.disconnect()).resolves.not.toThrow();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "⚠️ Docker Redis DISCONNECT failed:",
        "Already disconnected",
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe("integration scenarios", () => {
    beforeEach(() => {
      client = new DockerRedisClient();
    });

    it("should handle complete cache workflow", async () => {
      const cacheKey = "l2:query";
      const cacheValue = { products: [], count: 0 };

      // Set cache
      mockRedis.setex.mockResolvedValueOnce("OK");
      await client.set(cacheKey, cacheValue, { ex: 3600 });
      expect(mockRedis.setex).toHaveBeenCalledWith(
        cacheKey,
        3600,
        JSON.stringify(cacheValue),
      );

      // Get cache
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(cacheValue));
      const result = await client.get(cacheKey);
      expect(result).toEqual(cacheValue);
    });

    it("should handle frequency tracking workflow", async () => {
      const key = "freq:queries";
      const member = "search_term";

      // First check (should be null)
      mockRedis.zscore.mockResolvedValueOnce(null);
      expect(await client.zscore(key, member)).toBeNull();

      // Increment
      mockRedis.zincrby.mockResolvedValueOnce("1");
      expect(await client.zincrby(key, 1, member)).toBe("1");

      // Check again
      mockRedis.zscore.mockResolvedValueOnce("1");
      expect(await client.zscore(key, member)).toBe(1);
    });
  });
});
