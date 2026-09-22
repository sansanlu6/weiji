import { apiClient } from '@client/src/utils/api-client';
import type { WaterRecord, ListResponse } from '@shared/api.interface';

const BASE = 'api/health';

export async function getWaterList(params: { page?: number; pageSize?: number; startDate?: string; endDate?: string }) {
  const { data } = await apiClient.get(`${BASE}/water`, { params });
  return data as ListResponse<WaterRecord>;
}

export async function createWater(body: { drinkTime: string; amountMl: number }) {
  const { data } = await apiClient.post(`${BASE}/water`, body);
  return data as WaterRecord;
}

export async function updateWater(id: string, body: Partial<{ drinkTime: string; amountMl: number }>) {
  const { data } = await apiClient.patch(`${BASE}/water/${id}`, body);
  return data as WaterRecord;
}

export async function deleteWater(id: string) {
  await apiClient.delete(`${BASE}/water/${id}`);
}
