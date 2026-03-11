/**
 * Redis Client Interface
 * Abstract interface for Redis operations
 * Implementations: DockerRedisClient, VercelKvClient
 */

export interface IRedisClient {
  /**
   * GET command - retrieve value by key
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * SET command - store value with optional expiration
   */
  set(key: string, value: unknown, opts?: { ex?: number }): Promise<void>;

  /**
   * ZINCRBY command - increment score in sorted set
   */
  zincrby(
    key: string,
    increment: number,
    member: string,
  ): Promise<string | number>;

  /**
   * ZSCORE command - get score of member in sorted set
   */
  zscore(key: string, member: string): Promise<number | null>;

  /**
   * ZRANGE command - get range of members from sorted set
   */
  zrange(
    key: string,
    start: number,
    stop: number,
    opts?: { rev?: boolean; withScores?: boolean },
  ): Promise<(string | number)[]>;

  /**
   * ZCARD command - get number of members in sorted set
   */
  zcard(key: string): Promise<number>;

  /**
   * EXPIRE command - set TTL for key (in seconds)
   */
  expire(key: string, seconds: number): Promise<boolean>;
}
