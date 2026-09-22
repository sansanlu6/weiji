import { apiClient } from '@client/src/utils/api-client';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type {
  StatsItem,
  MoodDistribution,
  PainFrequency,
  CorrelationResult,
  AlertRecord,
  AlertConfig,
  WeeklyDetailStats,
  MonthlyDetailStats,
  HalfYearMonthlyStats,
  YearlyDetailStats,
} from '@shared/api.interface';

const BASE = 'api/health/stats';

export interface SleepStatsItem extends StatsItem {
  sleepTime?: string;
  wakeTime?: string;
  durationMinutes?: number;
}

export async function getSleepStats(
  range: number = 30,
): Promise<SleepStatsItem[]> {
  logger.info(`[stats] fetching sleep stats, range=${range}`);
  const { data } = await apiClient.get(`${BASE}/sleep`, {
    params: { range },
  });
  return data;
}

export async function getWaterStats(range: number = 30): Promise<StatsItem[]> {
  logger.info(`[stats] fetching water stats, range=${range}`);
  const { data } = await apiClient.get(`${BASE}/water`, {
    params: { range },
  });
  return data;
}

export async function getExerciseStats(
  range: number = 30,
): Promise<StatsItem[]> {
  logger.info(`[stats] fetching exercise stats, range=${range}`);
  const { data } = await apiClient.get(`${BASE}/exercise`, {
    params: { range },
  });
  return data;
}

export async function getMoodDistribution(
  startDate: string,
  endDate: string,
): Promise<MoodDistribution[]> {
  logger.info(`[stats] fetching mood distribution`);
  const { data } = await apiClient.get(`${BASE}/mood/distribution`, {
    params: { startDate, endDate },
  });
  return data;
}

export async function getPainFrequency(
  startDate: string,
  endDate: string,
): Promise<PainFrequency[]> {
  logger.info(`[stats] fetching pain frequency`);
  const { data } = await apiClient.get(`${BASE}/pain/frequency`, {
    params: { startDate, endDate },
  });
  return data;
}

export async function getCorrelation(
  type: 'sleep-mood' | 'exercise-sleep',
  range: number = 30,
): Promise<CorrelationResult> {
  logger.info(`[stats] fetching correlation type=${type}, range=${range}`);
  const { data } = await apiClient.get(`${BASE}/correlation/${type}`, {
    params: { range },
  });
  return data;
}

export async function getAlerts(
  startDate: string,
  endDate: string,
): Promise<AlertRecord[]> {
  logger.info(`[stats] fetching alerts`);
  const { data } = await apiClient.get(`${BASE}/alerts`, {
    params: { startDate, endDate },
  });
  return data;
}

export interface DietMealStat {
  date: string;
  mealType: string;
  count: number;
}

export async function getDietMealStats(
  startDate: string,
  endDate: string,
): Promise<DietMealStat[]> {
  logger.info('[stats] fetching diet meal stats');
  const { data } = await apiClient.get(`${BASE}/diet/meals`, {
    params: { startDate, endDate },
  });
  return data;
}

export async function getAlertConfig(): Promise<AlertConfig[]> {
  logger.info('[stats] fetching alert config');
  const { data } = await apiClient.get(`${BASE}/alert-config`);
  return data;
}

export async function updateAlertConfig(
  type: string,
  body: { threshold?: number; isEnabled?: boolean },
): Promise<AlertConfig> {
  logger.info(`[stats] updating alert config type=${type}`);
  const { data } = await apiClient.patch(
    `${BASE}/alert-config/${type}`,
    body,
  );
  return data;
}

export async function getWeeklyDetailStats(
  startDate: string,
  endDate: string,
): Promise<WeeklyDetailStats> {
  logger.info('[stats] fetching weekly detail stats');
  const { data } = await apiClient.get(`${BASE}/weekly-detail`, {
    params: { startDate, endDate },
  });
  return data;
}

export async function getMonthlyDetailStats(
  startDate: string,
  endDate: string,
): Promise<MonthlyDetailStats> {
  logger.info('[stats] fetching monthly detail stats');
  const { data } = await apiClient.get(`${BASE}/monthly-detail`, {
    params: { startDate, endDate },
  });
  return data;
}

export async function getHalfYearDetailStats(endMonth?: string): Promise<HalfYearMonthlyStats> {
  logger.info('[stats] fetching half year detail stats');
  const { data } = await apiClient.get(`${BASE}/halfyear-detail`, {
    params: endMonth ? { endMonth } : undefined,
  });
  return data;
}

export async function getYearDetailStats(year: number): Promise<YearlyDetailStats> {
  logger.info(`[stats] fetching year detail stats, year=${year}`);
  const { data } = await apiClient.get(`${BASE}/year-detail`, {
    params: { year },
  });
  return data;
}
