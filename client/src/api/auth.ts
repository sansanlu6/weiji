import { apiClient } from '@client/src/utils/api-client';
import type { AuthResponse, AuthUser, LoginRequest, RegisterRequest } from '@shared/auth.interface';

export async function login(username: string, password: string): Promise<AuthResponse> {
  const { data } = await apiClient.post('api/auth/login', { username, password } as LoginRequest);
  return data as AuthResponse;
}

export async function register(username: string, password: string): Promise<AuthResponse> {
  const { data } = await apiClient.post('api/auth/register', { username, password } as RegisterRequest);
  return data as AuthResponse;
}

export async function getMe(): Promise<AuthUser> {
  const { data } = await apiClient.get('api/auth/me');
  return data as AuthUser;
}
