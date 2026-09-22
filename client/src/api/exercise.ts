import { apiClient } from '@client/src/utils/api-client';
import type { ExerciseRecord, ListResponse } from '@shared/api.interface';

const BASE = 'api/health';

export async function getExerciseList(params: { page?: number; pageSize?: number; startDate?: string; endDate?: string }) {
  const { data } = await apiClient.get(`${BASE}/exercise`, { params });
  return data as ListResponse<ExerciseRecord>;
}

export async function createExercise(body: {
  exerciseType: string;
  startTime: string;
  endTime: string;
  note?: string;
}) {
  const { data } = await apiClient.post(`${BASE}/exercise`, body);
  return data as ExerciseRecord;
}

export async function updateExercise(id: string, body: Partial<{
  exerciseType: string;
  startTime: string;
  endTime: string;
  note: string;
}>) {
  const { data } = await apiClient.patch(`${BASE}/exercise/${id}`, body);
  return data as ExerciseRecord;
}

export async function deleteExercise(id: string) {
  await apiClient.delete(`${BASE}/exercise/${id}`);
}
