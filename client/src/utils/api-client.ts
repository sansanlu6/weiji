import { type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { logger } from '@lark-apaas/client-toolkit/logger';

export const TOKEN_KEY = 'healthtrack_token';
export const API_TIMEOUT_MS = 8000;

const apiClient = axiosForBackend;

apiClient.defaults.timeout = API_TIMEOUT_MS;
apiClient.defaults.timeoutErrorMessage = '请求超时，请检查网络后重试';

let authErrorHandler: (() => void) | null = null;
let authErrorFired = false;
let isVerifying = false;

function getToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

function hasToken(): boolean {
  return !!getToken();
}

function fireAuthError(): void {
  if (authErrorFired) return;
  if (!hasToken()) return;
  if (isVerifying) return;
  authErrorFired = true;
  if (authErrorHandler) {
    authErrorHandler();
  }
  setTimeout(() => {
    authErrorFired = false;
  }, 1000);
}

let requestInterceptorId: number | null = null;
let responseInterceptorId: number | null = null;

function setupInterceptors(): void {
  if (requestInterceptorId !== null) return;

  requestInterceptorId = apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getToken();
      if (token) {
        config.headers['x-app-jwt-token'] = token;
        config.headers['authorization'] = `Bearer ${token}`;
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  responseInterceptorId = apiClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error) => {
      const status = error?.response?.status;
      const url: string = error.config?.url || '';
      const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
      const isNetworkError = !error.response || error.code === 'ERR_NETWORK';

      if (isTimeout || isNetworkError) {
        logger.warn(`[API] request failed on ${url}, timeout=${isTimeout}, network=${isNetworkError}`);
        return Promise.reject(error);
      }

      if (status === 401) {
        const isAuthEndpoint =
          url.includes('auth/login') ||
          url.includes('auth/register') ||
          url.includes('auth/me');
        if (!isAuthEndpoint && hasToken() && !isVerifying) {
          logger.warn(`[Auth] 401 on ${url}, triggering logout`);
          fireAuthError();
        }
      }
      return Promise.reject(error);
    },
  );
}

setupInterceptors();

function setAuthErrorHandler(handler: () => void): void {
  authErrorHandler = handler;
}

function clearAuthErrorHandler(): void {
  authErrorHandler = null;
}

function setVerifying(verifying: boolean): void {
  isVerifying = verifying;
}

export { apiClient, setAuthErrorHandler, clearAuthErrorHandler, setVerifying };
export default apiClient;
