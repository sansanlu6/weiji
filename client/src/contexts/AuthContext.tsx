import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { logger } from '@lark-apaas/client-toolkit/logger';

import {
  TOKEN_KEY,
  API_TIMEOUT_MS,
  setAuthErrorHandler,
  clearAuthErrorHandler,
  setVerifying,
} from '@client/src/utils/api-client';
import { getMe, login as apiLogin, register as apiRegister } from '@client/src/api/auth';
import type { AuthUser } from '@shared/auth.interface';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_STORAGE_KEY = 'healthtrack_user';

function parseJwtPayload(token: string): { sub: string; username: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(decodeURIComponent(escape(atob(parts[1])))) as {
      sub?: string;
      username?: string;
      exp?: number;
    };
    if (!payload.sub || !payload.username) return null;
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return { sub: payload.sub, username: payload.username };
  } catch {
    return null;
  }
}

function readCachedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function cacheUser(user: AuthUser): void {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
}

function clearCachedUser(): void {
  try {
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readCachedUser());
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const isNavigatingRef = useRef(false);
  const isInitializingRef = useRef(true);
  const isLoadingRef = useRef(true);

  const setToken = useCallback((token: string | null) => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, []);

  const getToken = useCallback(() => {
    return localStorage.getItem(TOKEN_KEY);
  }, []);

  const redirectToLogin = useCallback(() => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    setUser(null);
    setToken(null);
    clearCachedUser();
    const currentPath = window.location.pathname;
    if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
      navigate('/login', { replace: true });
    }
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 500);
  }, [navigate, setToken]);

  const logout = useCallback(() => {
    redirectToLogin();
  }, [redirectToLogin]);

  const handleAuthError = useCallback(() => {
    if (isInitializingRef.current) return;
    if (isNavigatingRef.current) return;
    logger.warn('[Auth] authErrorHandler triggered, redirecting to login');
    redirectToLogin();
  }, [redirectToLogin]);

  useEffect(() => {
    setAuthErrorHandler(handleAuthError);
    return () => {
      clearAuthErrorHandler();
    };
  }, [handleAuthError]);

  useEffect(() => {
    let cancelled = false;
    const initAuth = async () => {
      const token = getToken();
      if (!token) {
        if (!cancelled) {
          setIsLoading(false);
          isInitializingRef.current = false;
        }
        return;
      }

      const payload = parseJwtPayload(token);
      if (!payload) {
        setToken(null);
        clearCachedUser();
        if (!cancelled) {
          setIsLoading(false);
          isInitializingRef.current = false;
        }
        return;
      }

      const cachedUser = readCachedUser();
      if (cachedUser && cachedUser.id === payload.sub && !cancelled) {
        setUser(cachedUser);
        setIsLoading(false);
        isLoadingRef.current = false;
      } else {
        const optimisticUser: AuthUser = {
          id: payload.sub,
          username: payload.username,
          createdAt: new Date(0).toISOString(),
        };
        setUser(optimisticUser);
        setIsLoading(false);
        isLoadingRef.current = false;
      }

      isInitializingRef.current = false;

      setVerifying(true);
      try {
        const me = await getMe();
        if (!cancelled) {
          setUser(me);
          cacheUser(me);
        }
      } catch (err) {
        logger.warn('[Auth] getMe failed during init, keeping optimistic state', err as Error);
      } finally {
        setVerifying(false);
      }
    };

    const initTimeout = setTimeout(() => {
      if (!cancelled && isLoadingRef.current) {
        logger.warn('[Auth] initAuth loading timeout, releasing loading state');
        const token = getToken();
        if (token) {
          const payload = parseJwtPayload(token);
          if (payload) {
            setUser({
              id: payload.sub,
              username: payload.username,
              createdAt: new Date(0).toISOString(),
            });
          }
        }
        setIsLoading(false);
        isLoadingRef.current = false;
        isInitializingRef.current = false;
      }
    }, Math.min(API_TIMEOUT_MS, 3000));

    initAuth();

    return () => {
      cancelled = true;
      clearTimeout(initTimeout);
      setVerifying(false);
    };
  }, [getToken, setToken]);

  const login = useCallback(async (username: string, password: string) => {
    const result = await apiLogin(username, password);
    setToken(result.token);
    setUser(result.user);
    cacheUser(result.user);
    isInitializingRef.current = false;
    setIsLoading(false);
    isNavigatingRef.current = false;
  }, [setToken]);

  const register = useCallback(async (username: string, password: string) => {
    const result = await apiRegister(username, password);
    setToken(result.token);
    setUser(result.user);
    cacheUser(result.user);
    isInitializingRef.current = false;
    setIsLoading(false);
    isNavigatingRef.current = false;
  }, [setToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
