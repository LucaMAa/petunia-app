import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, LoginDto, RegisterDto } from '../types';
import { authApi } from '../api/auth';
import { profileApi } from '../api/profile';
import { tokenStorage } from '../api/client';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (dto: LoginDto) => Promise<void>;
  register: (dto: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await tokenStorage.getAccess();
        if (token) {
          const profile = await profileApi.getProfile();
          setUser(profile);
        }
      } catch {
        await tokenStorage.clear();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (dto: LoginDto) => {
    const res = await authApi.login(dto);
    setUser(res.user);
  };

  const register = async (dto: RegisterDto) => {
    await authApi.register(dto);
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    const profile = await profileApi.getProfile();
    setUser(profile);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
