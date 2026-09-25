import type { RecentRecord, TodayOverview } from '@shared/api.interface';

export interface HomePageCacheEntry {
  overview: TodayOverview;
  recent: RecentRecord[];
  cachedAt: number;
}

const HOME_CACHE_TTL_MS = 2 * 60 * 1000;
const homePageCache = new Map<string, HomePageCacheEntry>();

export function getHomePageCache(userId: string): HomePageCacheEntry | undefined {
  const cached = homePageCache.get(userId);
  if (!cached) return undefined;

  if (Date.now() - cached.cachedAt >= HOME_CACHE_TTL_MS) {
    homePageCache.delete(userId);
    return undefined;
  }

  return cached;
}

export function setHomePageCache(
  userId: string,
  overview: TodayOverview,
  recent: RecentRecord[],
): void {
  homePageCache.set(userId, {
    overview,
    recent,
    cachedAt: Date.now(),
  });
}

export function invalidateHomePageCache(userId?: string): void {
  if (userId) {
    homePageCache.delete(userId);
    return;
  }

  homePageCache.clear();
}
