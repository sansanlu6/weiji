import { apiClient } from '@client/src/utils/api-client';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type { AchievementsResponse } from '@shared/api.interface';

const BASE = 'api/health';

export async function getAchievements(): Promise<AchievementsResponse> {
  try {
    const { data } = await apiClient.get<AchievementsResponse>(
      `${BASE}/achievements`,
    );
    return data;
  } catch (err) {
    logger.error('获取成就列表失败', err as Error);
    throw err;
  }
}
