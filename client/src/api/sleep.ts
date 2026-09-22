import { apiClient } from '@client/src/utils/api-client';
import type { SleepRecord, ListResponse, TodayOverview, RecentRecord } from '@shared/api.interface';

const BASE = 'api/health';

export async function getSleepList(params: { page?: number; pageSize?: number; startDate?: string; endDate?: string }) {
  const { data } = await apiClient.get(`${BASE}/sleep`, { params });
  return data as ListResponse<SleepRecord>;
}

export async function createSleep(body: { sleepTime: string; wakeTime: string; note?: string }) {
  const { data } = await apiClient.post(`${BASE}/sleep`, body);
  return data as SleepRecord;
}

export async function updateSleep(id: string, body: Partial<{ sleepTime: string; wakeTime: string; note: string }>) {
  const { data } = await apiClient.patch(`${BASE}/sleep/${id}`, body);
  return data as SleepRecord;
}

export async function deleteSleep(id: string) {
  await apiClient.delete(`${BASE}/sleep/${id}`);
}

export async function getTodayOverview() {
  const { data } = await apiClient.get(`${BASE}/overview/today`);
  return data as TodayOverview;
}

export async function getRecentRecords(limit: number = 10) {
  const { data } = await apiClient.get(`${BASE}/overview/recent`, { params: { limit } });
  return data as RecentRecord[];
}
