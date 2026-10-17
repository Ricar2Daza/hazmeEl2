import { create } from 'zustand';
import type { User, ApiResponse } from '../types';
import { authApi } from '../lib/axios';
import {
  setTokens,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setUser as saveUserSecure,
  getUser,
  deleteUser,
} from '../lib/secureStorage';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  register: (data: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  verifyEmail: (token: string) => Promise<any>;
  fetchMe: () => Promise<User | null>;
  updateProfile: (data: any) => Promise<any>;
  refresh: () => Promise<boolean>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
    if (user) {
      saveUserSecure(user);
    } else {
      deleteUser();
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const resp = await authApi.register(data);
      set({ isLoading: false });
      return resp.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error en registro';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const resp = await authApi.login({ email, password });
      const { accessToken, refreshToken, user } = resp.data as ApiResponse;
      if (accessToken && refreshToken) {
        await setTokens(accessToken, refreshToken);
        if (user) await saveUserSecure(user);
        set({
          user: user || null,
          accessToken: accessToken || null,
          refreshToken: refreshToken || null,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
      return resp.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error en login';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  verifyEmail: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const resp = await authApi.verify(token);
      set({ isLoading: false });
      return resp.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error verificando email';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  fetchMe: async () => {
    try {
      const resp = await authApi.me();
      const user = resp.data.data as User;
      set({ user, isAuthenticated: true });
      if (user) await saveUserSecure(user);
      return user;
    } catch {
      return null;
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const resp = await authApi.updateProfile(data);
      if (resp.data?.data) {
        const user = resp.data.data as User;
        set({ user, isAuthenticated: true });
        await saveUserSecure(user);
      }
      set({ isLoading: false });
      return resp.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error actualizando perfil';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  refresh: async () => {
    try {
      const rt = await getRefreshToken();
      if (!rt) return false;
      const resp = await authApi.refresh(rt);
      const { accessToken, refreshToken } = resp.data as ApiResponse;
      if (accessToken) {
        await setTokens(accessToken, refreshToken || rt);
        set({
          accessToken: accessToken || null,
          refreshToken: refreshToken || rt || null,
          isAuthenticated: true,
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  logout: async () => {
    await clearTokens();
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      error: null,
    });
  },

  hydrate: async () => {
    const token = await getAccessToken();
    const savedUser = await getUser<User>();
    if (savedUser) {
      set({
        user: savedUser,
        accessToken: token,
        isAuthenticated: true,
      });
    }
    if (token) {
      await get().fetchMe();
    }
  },
}));
