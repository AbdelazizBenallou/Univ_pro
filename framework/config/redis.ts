import { createClient, type RedisClientType } from "redis";
import { env } from "./env.js";

let redis: RedisClientType | undefined;

const CONNECT_TIMEOUT_MS = 3000;

const createRedisClient = (): RedisClientType => {
  const client: RedisClientType = createClient({
    url: env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 100) {
          console.warn("Redis: giving up after many reconnect attempts");
          return false;
        }
        return Math.min(retries * 100, 3000);
      },
    },
  });

  let errorCount = 0;
  client.on("error", (err) => {
    if (errorCount < 3) {
      console.error("Redis error:", err.message);
      errorCount += 1;
    }
  });

  client.on("connect", () => {
    console.log("Redis connected");
  });

  return client;
};

const connectRedis = async (): Promise<void> => {
  try {
    redis = createRedisClient();
    await Promise.race([
      redis.connect(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Redis connect timed out")), CONNECT_TIMEOUT_MS)
      ),
    ]);
  } catch (err) {
    console.warn("Redis connection failed, continuing without cache:", (err as Error).message);
  }
};

const disconnectRedis = async (): Promise<void> => {
  if (redis?.isOpen) {
    await redis.quit();
  }
};

export { redis, connectRedis, disconnectRedis };
