import { apiClient } from '@client/src/utils/api-client';
import type { MoodRecord, ListResponse } from '@shared/api.interface';

const BASE = 'api/health';

export async function getMoodList(params: { page?: number; pageSize?: number; startDate?: string; endDate?: string }) {
  const { data } = await apiClient.get(`${BASE}/mood`, { params });
  return data as ListResponse<MoodRecord>;
}

export async function createMood(body: { moods: string[]; recordTime: string; note?: string }) {
  const { data } = await apiClient.post(`${BASE}/mood`, body);
  return data as MoodRecord;
}

export async function updateMood(id: string, body: Partial<{ moods: string[]; recordTime: string; note: string }>) {
  const { data } = await apiClient.patch(`${BASE}/mood/${id}`, body);
  return data as MoodRecord;
}

export async function deleteMood(id: string) {
  await apiClient.delete(`${BASE}/mood/${id}`);
}
