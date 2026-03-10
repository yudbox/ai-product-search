/**
 * Docker Redis Client Implementation
 * Uses ioredis for local development with Docker Redis
 */

import { Redis } from "ioredis";
import type { IRedisClient } from "./client";

export class DockerRedisClient implements IRedisClient {
  private client: Redis;

  constructor(url?: string) {
    const redisUrl = url || process.env.REDIS_URL || "redis://localhost:6379";
    this.client = new Redis(redisUrl);

    console.log("🐳 Connecting to Docker Redis:", redisUrl);

    // Handle connection events
    this.client.on("connect", () => {
      console.log("✅ Docker Redis connected");
    });

    this.client.on("error", (err) => {
      console.warn("⚠️ Docker Redis connection error:", err.message);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        // If JSON parse fails, return as-is (for string values)
        return value as T;
      }
    } catch (error) {
      console.warn(
        `⚠️ Docker Redis GET failed for key "${key}":`,
        error instanceof Error ? error.message : error,
      );
      return null; // Graceful degradation: return null on error
    }
  }

  async set(
    key: string,
    value: unknown,
    opts?: { ex?: number },
  ): Promise<void> {
    try {
      const serialized =
        typeof value === "string" ? value : JSON.stringify(value);
      if (opts?.ex) {
        await this.client.setex(key, opts.ex, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      console.warn(
        `⚠️ Docker Redis SET failed for key "${key}":`,
        error instanceof Error ? error.message : error,
      );
      // Graceful degradation: silently fail, app continues without caching
    }
  }

  async zincrby(
    key: string,
    increment: number,
    member: string,
  ): Promise<string> {
    try {
      return await this.client.zincrby(key, increment, member);
    } catch (error) {
      console.warn(
        `⚠️ Docker Redis ZINCRBY failed for key "${key}":`,
        error instanceof Error ? error.message : error,
      );
      return "0"; // Graceful degradation: return "0" on error
    }
  }

  async zscore(key: string, member: string): Promise<number | null> {
    try {
      const score = await this.client.zscore(key, member);
      return score ? parseFloat(score) : null;
    } catch (error) {
      console.warn(
        `⚠️ Docker Redis ZSCORE failed for key "${key}":`,
        error instanceof Error ? error.message : error,
      );
      return null; // Graceful degradation: return null on error
    }
  }

  async zrange(
    key: string,
    start: number,
    stop: number,
    opts?: { rev?: boolean; withScores?: boolean },
  ): Promise<(string | number)[]> {
    try {
      if (opts?.rev && opts?.withScores) {
        return await this.client.zrevrange(key, start, stop, "WITHSCORES");
      }
      if (opts?.rev) {
        return await this.client.zrevrange(key, start, stop);
      }
      if (opts?.withScores) {
        return await this.client.zrange(key, start, stop, "WITHSCORES");
      }
      return await this.client.zrange(key, start, stop);
    } catch (error) {
      console.warn(
        `⚠️ Docker Redis ZRANGE failed for key "${key}":`,
        error instanceof Error ? error.message : error,
      );
      return []; // Graceful degradation: return empty array on error
    }
  }

  async zcard(key: string): Promise<number> {
    try {
      return await this.client.zcard(key);
    } catch (error) {
      console.warn(
        `⚠️ Docker Redis ZCARD failed for key "${key}":`,
        error instanceof Error ? error.message : error,
      );
      return 0; // Graceful degradation: return 0 on error
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.quit();
    } catch (error) {
      console.warn(
        "⚠️ Docker Redis DISCONNECT failed:",
        error instanceof Error ? error.message : error,
      );
      // Graceful degradation: silently fail on disconnect error
    }
  }
}
