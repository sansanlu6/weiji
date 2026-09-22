import { apiClient } from '@client/src/utils/api-client';
import type { PoopRecord, ListResponse } from '@shared/api.interface';

const BASE = 'api/health';

export async function getPoopList(params: { page?: number; pageSize?: number; startDate?: string; endDate?: string }) {
  const { data } = await apiClient.get(`${BASE}/poop`, { params });
  return data as ListResponse<PoopRecord>;
}

export async function createPoop(body: { poopTime: string; stoolType: string; note?: string }) {
  const { data } = await apiClient.post(`${BASE}/poop`, body);
  return data as PoopRecord;
}

export async function updatePoop(id: string, body: Partial<{ poopTime: string; stoolType: string; note: string }>) {
  const { data } = await apiClient.patch(`${BASE}/poop/${id}`, body);
  return data as PoopRecord;
}

export async function deletePoop(id: string) {
  await apiClient.delete(`${BASE}/poop/${id}`);
}
