import { Redis } from "@upstash/redis";

let redisClient: Redis | null = null;

export function getRedisClient() {
  if (redisClient) {
    return redisClient;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error("Missing Upstash Redis environment variables");
  }

  redisClient = new Redis({
    url,
    token,
  });

  return redisClient;
}
