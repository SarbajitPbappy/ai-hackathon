import { getRedisClient } from "@/lib/redis";

export async function consumeRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
) {
  const redis = getRedisClient();
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }

  return {
    allowed: count <= limit,
    count,
    remaining: Math.max(0, limit - count),
  };
}
