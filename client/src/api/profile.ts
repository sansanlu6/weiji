import { apiClient } from '@client/src/utils/api-client';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type {
  ProfileSummary,
  UpdateProfileRequest,
  UserProfileInfo,
} from '@shared/api.interface';

const BASE = 'api/health';

export async function getProfileSummary(): Promise<ProfileSummary> {
  logger.info('[profile] fetching profile summary');
  const { data } = await apiClient.get(`${BASE}/profile-summary`);
  return data;
}

export async function getProfile(): Promise<UserProfileInfo> {
  logger.info('[profile] fetching user profile');
  const { data } = await apiClient.get(`${BASE}/profile`);
  return data;
}

export async function updateProfile(
  payload: UpdateProfileRequest,
): Promise<UserProfileInfo> {
  logger.info('[profile] updating profile');
  const { data } = await apiClient.put(`${BASE}/profile`, payload);
  return data;
}
