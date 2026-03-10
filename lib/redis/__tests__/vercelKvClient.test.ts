/**
 * Unit tests for Vercel KV Client
 */

// Mock @vercel/kv BEFORE importing
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

import { VercelKvClient } from "../vercelKvClient";
import { kv } from "@vercel/kv";

const mockKv = jest.mocked(kv);

describe("VercelKvClient", () => {
  let client: VercelKvClient;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
    client = new VercelKvClient();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe("constructor", () => {
    it("should log initialization message", () => {
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "☁️ Using Vercel KV (Upstash REST API)",
      );
    });

    it("should create a new instance", () => {
      expect(client).toBeInstanceOf(VercelKvClient);
    });
  });

  describe("get", () => {
    it("should get value from kv store", async () => {
      const mockValue = { name: "test", value: 123 };
      mockKv.get.mockResolvedValueOnce(mockValue);

      const result = await client.get("test_key");

      expect(mockKv.get).toHaveBeenCalledWith("test_key");
      expect(result).toEqual(mockValue);
    });

    it("should return null when key does not exist", async () => {
      mockKv.get.mockResolvedValueOnce(null);

      const result = await client.get("nonexistent_key");

      expect(mockKv.get).toHaveBeenCalledWith("nonexistent_key");
      expect(result).toBeNull();
    });

    it("should handle different data types", async () => {
      // String
      mockKv.get.mockResolvedValueOnce("string value");
      await expect(client.get<string>("string_key")).resolves.toBe(
        "string value",
      );

      // Number
      mockKv.get.mockResolvedValueOnce(42);
      await expect(client.get<number>("number_key")).resolves.toBe(42);

      // Object
      const obj = { foo: "bar", count: 5 };
      mockKv.get.mockResolvedValueOnce(obj);
      await expect(client.get<typeof obj>("object_key")).resolves.toEqual(obj);

      // Array
      const arr = [1, 2, 3];
      mockKv.get.mockResolvedValueOnce(arr);
      await expect(client.get<number[]>("array_key")).resolves.toEqual(arr);
    });

    it("should handle errors from kv", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      mockKv.get.mockRejectedValueOnce(new Error("Connection failed"));

      const result = await client.get("error_key");

      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ Vercel KV GET failed for key "error_key":',
        "Connection failed",
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe("set", () => {
    it("should set value without expiration", async () => {
      mockKv.set.mockResolvedValueOnce("OK");

      await client.set("test_key", "test_value");

      expect(mockKv.set).toHaveBeenCalledWith("test_key", "test_value");
      expect(mockKv.set).toHaveBeenCalledTimes(1);
    });

    it("should set value with expiration", async () => {
      mockKv.set.mockResolvedValueOnce("OK");

      await client.set("test_key", "test_value", { ex: 3600 });

      expect(mockKv.set).toHaveBeenCalledWith("test_key", "test_value", {
        ex: 3600,
      });
    });

    it("should set different data types", async () => {
      mockKv.set.mockResolvedValue("OK");

      // String
      await client.set("string_key", "hello");
      expect(mockKv.set).toHaveBeenCalledWith("string_key", "hello");

      // Number
      await client.set("number_key", 123);
      expect(mockKv.set).toHaveBeenCalledWith("number_key", 123);

      // Object
      const obj = { test: true };
      await client.set("object_key", obj);
      expect(mockKv.set).toHaveBeenCalledWith("object_key", obj);

      // Array
      await client.set("array_key", [1, 2, 3]);
      expect(mockKv.set).toHaveBeenCalledWith("array_key", [1, 2, 3]);
    });

    it("should set value with zero expiration", async () => {
      mockKv.set.mockResolvedValueOnce("OK");

      await client.set("key", "value", { ex: 0 });

      // ex: 0 is falsy, so should call without options
      expect(mockKv.set).toHaveBeenCalledWith("key", "value");
    });

    it("should handle different expiration times", async () => {
      mockKv.set.mockResolvedValue("OK");

      // Short expiration
      await client.set("key1", "val1", { ex: 60 });
      expect(mockKv.set).toHaveBeenCalledWith("key1", "val1", { ex: 60 });

      // Long expiration
      await client.set("key2", "val2", { ex: 86400 });
      expect(mockKv.set).toHaveBeenCalledWith("key2", "val2", { ex: 86400 });
    });

    it("should handle errors from kv", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      mockKv.set.mockRejectedValueOnce(new Error("Write failed"));

      await expect(client.set("key", "value")).resolves.not.toThrow();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ Vercel KV SET failed for key "key":',
        "Write failed",
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe("zincrby", () => {
    it("should increment sorted set member score", async () => {
      mockKv.zincrby.mockResolvedValueOnce(5);

      const result = await client.zincrby("freq:queries", 1, "search_term");

      expect(mockKv.zincrby).toHaveBeenCalledWith(
        "freq:queries",
        1,
        "search_term",
      );
      expect(result).toBe(5);
    });

    it("should increment by different amounts", async () => {
      mockKv.zincrby.mockResolvedValueOnce(10);

      const result = await client.zincrby("leaderboard", 5, "player1");

      expect(mockKv.zincrby).toHaveBeenCalledWith("leaderboard", 5, "player1");
      expect(result).toBe(10);
    });

    it("should handle negative increments", async () => {
      mockKv.zincrby.mockResolvedValueOnce(3);

      const result = await client.zincrby("scores", -2, "user");

      expect(mockKv.zincrby).toHaveBeenCalledWith("scores", -2, "user");
      expect(result).toBe(3);
    });

    it("should handle first increment returning 1", async () => {
      mockKv.zincrby.mockResolvedValueOnce(1);

      const result = await client.zincrby("new_set", 1, "new_member");

      expect(result).toBe(1);
    });

    it("should handle errors from kv", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      mockKv.zincrby.mockRejectedValueOnce(new Error("Zincrby failed"));

      const result = await client.zincrby("set", 1, "member");

      expect(result).toBe(0);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ Vercel KV ZINCRBY failed for key "set":',
        "Zincrby failed",
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe("zscore", () => {
    it("should get score of sorted set member", async () => {
      mockKv.zscore.mockResolvedValueOnce(10);

      const result = await client.zscore("freq:queries", "search_term");

      expect(mockKv.zscore).toHaveBeenCalledWith("freq:queries", "search_term");
      expect(result).toBe(10);
    });

    it("should return null for non-existent member", async () => {
      mockKv.zscore.mockResolvedValueOnce(null);

      const result = await client.zscore("set", "nonexistent");

      expect(mockKv.zscore).toHaveBeenCalledWith("set", "nonexistent");
      expect(result).toBeNull();
    });

    it("should handle zero score", async () => {
      mockKv.zscore.mockResolvedValueOnce(0);

      const result = await client.zscore("set", "member");

      expect(result).toBe(0);
    });

    it("should handle decimal scores", async () => {
      mockKv.zscore.mockResolvedValueOnce(3.14159);

      const result = await client.zscore("set", "member");

      expect(result).toBe(3.14159);
    });

    it("should handle errors from kv", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      mockKv.zscore.mockRejectedValueOnce(new Error("Zscore failed"));

      const result = await client.zscore("set", "member");

      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ Vercel KV ZSCORE failed for key "set":',
        "Zscore failed",
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe("zrange", () => {
    it("should get range from sorted set", async () => {
      const mockRange = ["member1", "member2", "member3"];
      mockKv.zrange.mockResolvedValueOnce(mockRange);

      const result = await client.zrange("leaderboard", 0, 2);

      expect(mockKv.zrange).toHaveBeenCalledWith(
        "leaderboard",
        0,
        2,
        undefined,
      );
      expect(result).toEqual(mockRange);
    });

    it("should get range with reverse option", async () => {
      const mockRange = ["top1", "top2", "top3"];
      mockKv.zrange.mockResolvedValueOnce(mockRange);

      const result = await client.zrange("scores", 0, 2, { rev: true });

      expect(mockKv.zrange).toHaveBeenCalledWith("scores", 0, 2, { rev: true });
      expect(result).toEqual(mockRange);
    });

    it("should get range with scores", async () => {
      const mockRange = ["member1", 10, "member2", 20];
      mockKv.zrange.mockResolvedValueOnce(mockRange);

      const result = await client.zrange("set", 0, 1, { withScores: true });

      expect(mockKv.zrange).toHaveBeenCalledWith("set", 0, 1, {
        withScores: true,
      });
      expect(result).toEqual(mockRange);
    });

    it("should get range with both options", async () => {
      const mockRange = ["top", 100, "second", 90];
      mockKv.zrange.mockResolvedValueOnce(mockRange);

      const result = await client.zrange("scores", 0, 1, {
        rev: true,
        withScores: true,
      });

      expect(mockKv.zrange).toHaveBeenCalledWith("scores", 0, 1, {
        rev: true,
        withScores: true,
      });
      expect(result).toEqual(mockRange);
    });

    it("should handle negative indices", async () => {
      mockKv.zrange.mockResolvedValueOnce(["last"]);

      const result = await client.zrange("set", -1, -1);

      expect(mockKv.zrange).toHaveBeenCalledWith("set", -1, -1, undefined);
      expect(result).toEqual(["last"]);
    });

    it("should handle empty range", async () => {
      mockKv.zrange.mockResolvedValueOnce([]);

      const result = await client.zrange("empty_set", 0, 10);

      expect(result).toEqual([]);
    });

    it("should handle errors from kv", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      mockKv.zrange.mockRejectedValueOnce(new Error("Zrange failed"));

      const result = await client.zrange("set", 0, 10);

      expect(result).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ Vercel KV ZRANGE failed for key "set":',
        "Zrange failed",
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe("zcard", () => {
    it("should get cardinality of sorted set", async () => {
      mockKv.zcard.mockResolvedValueOnce(42);

      const result = await client.zcard("leaderboard");

      expect(mockKv.zcard).toHaveBeenCalledWith("leaderboard");
      expect(result).toBe(42);
    });

    it("should return 0 for empty set", async () => {
      mockKv.zcard.mockResolvedValueOnce(0);

      const result = await client.zcard("empty_set");

      expect(mockKv.zcard).toHaveBeenCalledWith("empty_set");
      expect(result).toBe(0);
    });

    it("should return 0 for non-existent set", async () => {
      mockKv.zcard.mockResolvedValueOnce(0);

      const result = await client.zcard("nonexistent");

      expect(result).toBe(0);
    });

    it("should handle large cardinalities", async () => {
      mockKv.zcard.mockResolvedValueOnce(1000000);

      const result = await client.zcard("huge_set");

      expect(result).toBe(1000000);
    });

    it("should handle errors from kv", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      mockKv.zcard.mockRejectedValueOnce(new Error("Zcard failed"));

      const result = await client.zcard("set");

      expect(result).toBe(0);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ Vercel KV ZCARD failed for key "set":',
        "Zcard failed",
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe("integration scenarios", () => {
    it("should handle frequency tracking workflow", async () => {
      // Initial score check
      mockKv.zscore.mockResolvedValueOnce(null);
      expect(await client.zscore("freq:queries", "new_query")).toBeNull();

      // First increment
      mockKv.zincrby.mockResolvedValueOnce(1);
      expect(await client.zincrby("freq:queries", 1, "new_query")).toBe(1);

      // Check updated score
      mockKv.zscore.mockResolvedValueOnce(1);
      expect(await client.zscore("freq:queries", "new_query")).toBe(1);

      // Another increment
      mockKv.zincrby.mockResolvedValueOnce(2);
      expect(await client.zincrby("freq:queries", 1, "new_query")).toBe(2);
    });

    it("should handle cache workflow", async () => {
      const cacheKey = "l2:semantic_query";
      const cacheValue = { products: [], count: 0 };

      // Set cache with TTL
      mockKv.set.mockResolvedValueOnce("OK");
      await client.set(cacheKey, cacheValue, { ex: 3600 });

      // Get cache
      mockKv.get.mockResolvedValueOnce(cacheValue);
      const result = await client.get(cacheKey);

      expect(result).toEqual(cacheValue);
    });
  });
});
