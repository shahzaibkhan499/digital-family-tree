'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api } from './api-client';

interface User {
  id: string;
  displayId?: string;
  name: string;
  email: string;
  avatar?: string;
  coverPhoto?: string;
  role?: string;
  plan?: string;
  createdAt: string;
  updatedAt?: string;
  username?: string;
  profileSlug?: string;
  emailVerified?: boolean;
  accountStatus?: string;
  lastLoginAt?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  displayName?: string;
  nickname?: string;
  gender?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  bloodGroup?: string;
  maritalStatus?: string;
  nationality?: string;
  religion?: string;
  languages?: string;
  phone?: string;
  whatsapp?: string;
  alternativePhone?: string;
  country?: string;
  province?: string;
  city?: string;
  postalCode?: string;
  fullAddress?: string;
  bio?: string;
  occupation?: string;
  company?: string;
  education?: string;
  skills?: string;
  interests?: string;
  website?: string;
  socialLinks?: string;
  fatherId?: string;
  motherId?: string;
  spouseId?: string;
  childrenIds?: string;
  siblingIds?: string;
  locale?: string;
  timezone?: string;
  privacySettings?: string;
  twoFactorEnabled?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const scheduleTokenRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    refreshTimerRef.current = setTimeout(async () => {
      if (!mountedRef.current) return;
      try {
        await api.auth.refresh();
        if (mountedRef.current) scheduleTokenRefresh();
      } catch {
        if (!mountedRef.current) return;
        api.removeToken();
        api.removeRefreshToken();
        setUser(null);
        router.push('/login');
      }
    }, 14 * 60 * 1000);
  }, [router]);

  const refreshUser = useCallback(async () => {
    const token = api.getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const userData = await api.auth.me();
      if (!mountedRef.current) return;
      setUser(userData);
      scheduleTokenRefresh();
    } catch (err: any) {
      if (!mountedRef.current) return;
      if (err.status === 401) {
        try {
          await api.auth.refresh();
          if (!mountedRef.current) return;
          const userData = await api.auth.me();
          setUser(userData);
          scheduleTokenRefresh();
        } catch {
          api.removeToken();
          api.removeRefreshToken();
          setUser(null);
        }
      } else {
        api.removeToken();
        setUser(null);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [scheduleTokenRefresh]);

  useEffect(() => {
    mountedRef.current = true;
    refreshUser();
    return () => {
      mountedRef.current = false;
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const result = await api.auth.login({ email, password });
    api.setToken(result.access_token);
    if (result.refresh_token) {
      api.setRefreshToken(result.refresh_token);
    }
    setUser(result.user);
    scheduleTokenRefresh();
  };

  const register = async (name: string, email: string, password: string) => {
    const result = await api.auth.register({ name, email, password });
    api.setToken(result.access_token);
    if (result.refresh_token) {
      api.setRefreshToken(result.refresh_token);
    }
    setUser(result.user);
    scheduleTokenRefresh();
  };

  const logout = () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    api.auth.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
