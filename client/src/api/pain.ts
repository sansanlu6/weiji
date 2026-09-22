import { apiClient } from '@client/src/utils/api-client';
import type { PainRecord, ListResponse, PainMarker } from '@shared/api.interface';

const BASE = 'api/health';

export async function getPainList(params: { page?: number; pageSize?: number; startDate?: string; endDate?: string }) {
  const { data } = await apiClient.get(`${BASE}/pain`, { params });
  return data as ListResponse<PainRecord>;
}

export async function createPain(body: {
  symptoms: string[];
  painLevel: 'mild' | 'moderate' | 'severe';
  startTime: string;
  endTime?: string;
  description?: string;
  note?: string;
  painMarkers?: PainMarker[];
}) {
  const { data } = await apiClient.post(`${BASE}/pain`, body);
  return data as PainRecord;
}

export async function updatePain(id: string, body: Partial<{
  symptoms: string[];
  painLevel: 'mild' | 'moderate' | 'severe';
  startTime: string;
  endTime: string;
  description: string;
  note: string;
  painMarkers: PainMarker[];
}>) {
  const { data } = await apiClient.patch(`${BASE}/pain/${id}`, body);
  return data as PainRecord;
}

export async function deletePain(id: string) {
  await apiClient.delete(`${BASE}/pain/${id}`);
}
