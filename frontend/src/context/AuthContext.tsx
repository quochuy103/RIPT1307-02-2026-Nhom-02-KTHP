import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AUTH_UNAUTHORIZED_EVENT } from '@/lib/auth-events';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatarUrl?: string | null;
}

const isValidRole = (role: unknown): role is User['role'] => role === 'user' || role === 'admin';

const normalizeStoredUser = (value: unknown): User | null => {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as Partial<User>;
  if (typeof candidate.id !== 'number' || typeof candidate.name !== 'string' || typeof candidate.email !== 'string') {
    return null;
  }

  if (!isValidRole(candidate.role)) {
    return null;
  }

  return {
    id: candidate.id,
    name: candidate.name,
    email: candidate.email,
    role: candidate.role,
    avatarUrl: typeof candidate.avatarUrl === 'string' ? candidate.avatarUrl : null,
  };
};

interface AuthResponse {
  token: string;
  user: User;
}

interface ApiErrorResponse {
  message?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  oauthLogin: (provider: string, token: string) => Promise<void>;
  logout: (options?: LogoutOptions) => void;
  syncUser: (user: User) => void;
}

interface LogoutOptions {
  redirectTo?: string;
  showToast?: boolean;
  message?: string;
}

const TOKEN_STORAGE_KEY = 'cutie_cuts_token';
const USER_STORAGE_KEY = 'cutie_cuts_user';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8081';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    const user = normalizeStoredUser(JSON.parse(raw));
    if (!user) {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
    return user;
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
};

const getErrorMessage = async (response: Response) => {
  try {
    const data = (await response.json()) as ApiErrorResponse;
    return data.message || 'Request failed';
  } catch {
    return 'Request failed';
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const persistAuth = useCallback((auth: AuthResponse) => {
    setUser(auth.user);
    setToken(auth.token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(auth.user));
    localStorage.setItem(TOKEN_STORAGE_KEY, auth.token);
  }, []);

  const syncUser = useCallback((nextUser: User) => {
    setUser(nextUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
  }, []);

  const clearAuth = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    persistAuth(await response.json() as AuthResponse);
  }, [persistAuth]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    persistAuth(await response.json() as AuthResponse);
  }, [persistAuth]);

  const oauthLogin = useCallback(async (provider: string, oauthToken: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/oauth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, token: oauthToken }),
    });

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    persistAuth(await response.json() as AuthResponse);
  }, [persistAuth]);

  const logout = useCallback((options?: LogoutOptions) => {
    clearAuth();

    if (options?.showToast) {
      toast.success(options.message ?? 'Logged out successfully');
    }

    if (options?.redirectTo && location.pathname !== options.redirectTo) {
      navigate(options.redirectTo, { replace: true });
    }
  }, [clearAuth, location.pathname, navigate]);

  useEffect(() => {
    const restoreSession = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Session expired');
        }

        const data = await response.json() as {
          id: number;
          name?: string;
          fullName?: string;
          email?: string;
          role?: string;
          avatarUrl?: string | null;
        };

        const normalizedRole = data.role === 'admin' ? 'admin' : 'user';
        syncUser({
          id: data.id,
          name: data.fullName || data.name || '',
          email: data.email || '',
          role: normalizedRole,
          avatarUrl: data.avatarUrl ?? null,
        });
      } catch {
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    void restoreSession();
  }, [clearAuth, syncUser, token]);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout({
        redirectTo: '/auth',
        showToast: true,
        message: 'Session expired. Please sign in again.',
      });
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user && !!token, isLoading, login, register, oauthLogin, logout, syncUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
