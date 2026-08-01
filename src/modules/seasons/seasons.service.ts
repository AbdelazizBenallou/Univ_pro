import prisma from "../../../framework/config/prisma.js";
import { cache } from "../../../framework/utils/cache.js";
import logger from "../../../framework/config/logger.js";

const SEASONS_CACHE_KEY = "seasons:list";
const SEASONS_CACHE_TTL = 12 * 60 * 60; // 12 hours

export const seasonService = {
  async findAll() {
    const cached = await cache.get<{ id: number; name: string; is_current: boolean }[]>(SEASONS_CACHE_KEY);
    if (cached) {
      logger.debug("Seasons served from cache");
      return cached;
    }

    const seasons = await prisma.seasons.findMany({
      select: { id: true, name: true, is_current: true },
      orderBy: { id: "asc" },
    });

    await cache.set(SEASONS_CACHE_KEY, seasons, SEASONS_CACHE_TTL);
    logger.debug("Seasons fetched from DB and cached for 12h");

    return seasons;
  },

  async invalidateCache() {
    await cache.del(SEASONS_CACHE_KEY);
  },
};
