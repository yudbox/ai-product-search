/**
 * Vercel KV Client Implementation
 * Uses @vercel/kv for production deployment on Vercel
 */

import { kv } from "@vercel/kv";
import type { IRedisClient } from "./client";

export class VercelKvClient implements IRedisClient {
  constructor() {
    console.log("☁️ Using Vercel KV (Upstash REST API)");
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      return await kv.get<T>(key);
    } catch (error) {
      console.warn(
        `⚠️ Vercel KV GET failed for key "${key}":`,
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
      if (opts?.ex) {
        await kv.set(key, value, { ex: opts.ex });
      } else {
        await kv.set(key, value);
      }
    } catch (error) {
      console.warn(
        `⚠️ Vercel KV SET failed for key "${key}":`,
        error instanceof Error ? error.message : error,
      );
      // Graceful degradation: silently fail, app continues without caching
    }
  }

  async zincrby(
    key: string,
    increment: number,
    member: string,
  ): Promise<number> {
    try {
      return await kv.zincrby(key, increment, member);
    } catch (error) {
      console.warn(
        `⚠️ Vercel KV ZINCRBY failed for key "${key}":`,
        error instanceof Error ? error.message : error,
      );
      return 0; // Graceful degradation: return 0 on error
    }
  }

  async zscore(key: string, member: string): Promise<number | null> {
    try {
      return await kv.zscore(key, member);
    } catch (error) {
      console.warn(
        `⚠️ Vercel KV ZSCORE failed for key "${key}":`,
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
      return await kv.zrange(key, start, stop, opts);
    } catch (error) {
      console.warn(
        `⚠️ Vercel KV ZRANGE failed for key "${key}":`,
        error instanceof Error ? error.message : error,
      );
      return []; // Graceful degradation: return empty array on error
    }
  }

  async zcard(key: string): Promise<number> {
    try {
      return await kv.zcard(key);
    } catch (error) {
      console.warn(
        `⚠️ Vercel KV ZCARD failed for key "${key}":`,
        error instanceof Error ? error.message : error,
      );
      return 0; // Graceful degradation: return 0 on error
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await kv.expire(key, seconds);
      return result === 1; // Redis returns 1 if TTL was set, 0 if key doesn't exist
    } catch (error) {
      console.warn(
        `⚠️ Vercel KV EXPIRE failed for key "${key}":`,
        error instanceof Error ? error.message : error,
      );
      return false; // Graceful degradation: return false on error
    }
  }
}
