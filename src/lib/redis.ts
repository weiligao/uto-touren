import { Redis } from "@upstash/redis";

/**
 * Lazily-initialised Upstash Redis client.
 * Returns null when the required env vars are absent (local dev without Redis).
 * Set KV_REST_API_URL and KV_REST_API_TOKEN in your Vercel project
 * (or .env.local) to enable the persistent cache.
 */
function createRedisClient(): Redis | null {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) { return null; }
  return new Redis({ url, token });
}

export const redis = createRedisClient();
