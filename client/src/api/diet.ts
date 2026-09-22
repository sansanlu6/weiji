import { apiClient } from '@client/src/utils/api-client';
import type { DietRecord, ListResponse } from '@shared/api.interface';

const BASE = 'api/health';

export async function getDietList(params: { page?: number; pageSize?: number; startDate?: string; endDate?: string }) {
  const { data } = await apiClient.get(`${BASE}/diet`, { params });
  return data as ListResponse<DietRecord>;
}

export async function createDiet(body: {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'supper' | 'snack';
  eatTime: string;
  foodDescription: string;
  foodImageUrl?: string;
  tags?: string[];
  note?: string;
}) {
  const { data } = await apiClient.post(`${BASE}/diet`, body);
  return data as DietRecord;
}

export async function updateDiet(id: string, body: Partial<{
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'supper' | 'snack';
  eatTime: string;
  foodDescription: string;
  foodImageUrl: string;
  tags: string[];
  note: string;
}>) {
  const { data } = await apiClient.patch(`${BASE}/diet/${id}`, body);
  return data as DietRecord;
}

export async function deleteDiet(id: string) {
  await apiClient.delete(`${BASE}/diet/${id}`);
}
