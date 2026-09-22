import { apiClient } from '@client/src/utils/api-client';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type {
  DataSearchResponse,
  RecycleRecord,
  BatchDeleteResult,
  ExportJsonResult,
  ImageDedupQueryResponse,
  ImageDedupRegisterResponse,
} from '@shared/api.interface';

const BASE = 'api/health/data';

export async function searchRecords(params: {
  keyword?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}): Promise<DataSearchResponse> {
  const { data } = await apiClient.get(`${BASE}/search`, { params });
  return data;
}

export async function getRecycleBin(params: {
  keyword?: string;
  type?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ items: RecycleRecord[]; total: number; page: number; pageSize: number }> {
  const { data } = await apiClient.get(`${BASE}/recycle-bin`, { params });
  return data;
}

export async function restoreRecord(type: string, id: string): Promise<{ success: boolean }> {
  const { data } = await apiClient.post(`${BASE}/recycle-bin/${type}/${id}/restore`);
  return data;
}

export async function permanentDelete(type: string, id: string): Promise<void> {
  await apiClient.delete(`${BASE}/recycle-bin/${type}/${id}`);
}

export async function exportRecords(params: {
  type?: string;
  startDate?: string;
  endDate?: string;
  format?: string;
}): Promise<ExportJsonResult | string> {
  const { data } = await apiClient.get(`${BASE}/export`, { params });
  return data;
}

export async function batchRestore(type: string, ids: string[]): Promise<{ success: boolean; restoredCount: number }> {
  const { data } = await apiClient.post(`${BASE}/recycle-bin/batch-restore`, { type, ids });
  logger.info(`batchRestore: restored ${data.restoredCount} records`);
  return data;
}

export async function batchPermanentDelete(type: string, ids: string[]): Promise<{ success: boolean; deletedCount: number }> {
  const { data } = await apiClient.post(`${BASE}/recycle-bin/batch-delete`, { type, ids });
  logger.info(`batchPermanentDelete: deleted ${data.deletedCount} records`);
  return data;
}

export async function batchDelete(type: string, ids: string[]): Promise<BatchDeleteResult> {
  const { data } = await apiClient.post(`${BASE}/batch-delete`, { type, ids });
  logger.info(`batchDelete: deleted ${data.deletedCount} records`);
  return data;
}

export async function queryImageDedup(
  fileHash: string,
): Promise<ImageDedupQueryResponse> {
  const { data } = await apiClient.get(`${BASE}/image-dedup/query`, {
    params: { fileHash },
  });
  return data;
}

export async function registerImageDedup(params: {
  fileHash: string;
  fileName: string;
  downloadUrl: string;
  fileSize: number;
}): Promise<ImageDedupRegisterResponse> {
  const { data } = await apiClient.post(
    `${BASE}/image-dedup/register`,
    params,
  );
  return data;
}
