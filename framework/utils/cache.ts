import type { RedisClientType } from "redis";
import { redis } from "../config/redis.js";

const DEFAULT_TTL = 300;

// In-memory fallback store (used while Redis is unavailable)
const memoryStore = new Map<string, { value: string; expiresAt: number }>();

function isRedisReady(): boolean {
  return (redis as RedisClientType | undefined)?.isOpen === true;
}

function memoryGetRaw(key: string): string | null {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value;
}

function memorySetRaw(key: string, value: string, ttl: number): void {
  memoryStore.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
}

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    if (isRedisReady()) {
      try {
        const data = await redis!.get(key);
        if (!data) return null;
        return JSON.parse(data) as T;
      } catch {
        // fall back to memory below
      }
    }

    try {
      const raw = memoryGetRaw(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async set(key: string, value: unknown, ttl = DEFAULT_TTL): Promise<void> {
    const serialized = JSON.stringify(value);

    if (isRedisReady()) {
      try {
        await redis!.set(key, serialized, { EX: ttl });
        return;
      } catch {
        // fall back to memory below
      }
    }

    memorySetRaw(key, serialized, ttl);
  },

  async del(key: string): Promise<void> {
    if (isRedisReady()) {
      try {
        await redis!.del(key);
      } catch {
        // ignore
      }
    }
    memoryStore.delete(key);
  },

  async delPattern(pattern: string): Promise<void> {
    if (isRedisReady()) {
      try {
        const keys = await redis!.keys(pattern);
        if (keys.length > 0) {
          await redis!.del(keys);
        }
      } catch {
        // ignore
      }
    }

    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
    const re = new RegExp(`^${escaped}$`);
    for (const key of memoryStore.keys()) {
      if (re.test(key)) memoryStore.delete(key);
    }
  },

  async exists(key: string): Promise<boolean> {
    if (isRedisReady()) {
      try {
        const result = await redis!.exists(key);
        if (result === 1) return true;
      } catch {
        // fall back to memory below
      }
    }

    return memoryGetRaw(key) !== null;
  },
};
