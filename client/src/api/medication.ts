import { apiClient } from '@client/src/utils/api-client';
import type { MedicationRecord, ListResponse } from '@shared/api.interface';

const BASE = 'api/health';

export async function getMedicationList(params: { page?: number; pageSize?: number; startDate?: string; endDate?: string }) {
  const { data } = await apiClient.get(`${BASE}/medication`, { params });
  return data as ListResponse<MedicationRecord>;
}

export async function createMedication(body: {
  medicineName: string;
  dosage: string;
  takeTime: string;
  relatedSymptom?: string;
  painRecordId?: string;
  note?: string;
}) {
  const { data } = await apiClient.post(`${BASE}/medication`, body);
  return data as MedicationRecord;
}

export async function updateMedication(id: string, body: Partial<{
  medicineName: string;
  dosage: string;
  takeTime: string;
  relatedSymptom: string;
  painRecordId: string;
  note: string;
}>) {
  const { data } = await apiClient.patch(`${BASE}/medication/${id}`, body);
  return data as MedicationRecord;
}

export async function deleteMedication(id: string) {
  await apiClient.delete(`${BASE}/medication/${id}`);
}
