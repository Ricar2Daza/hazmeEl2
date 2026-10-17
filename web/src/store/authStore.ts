import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/axios';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import {
  RegisterInput,
  LoginInput,
  EditProfileInput,
} from '@/lib/schemas/zodSchemas';

export interface User {
  id: string;
  email: string;
  fullName: string;
  emailVerified: boolean;
  phone?: string | null;
  companyName?: string | null;
  portfolioUrl?: string | null;
  bio?: string | null;
  experienceYears?: number | null;
  skills?: string[];
  locationAddress?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  register: (data: RegisterInput) => Promise<void>;
  login: (data: LoginInput) => Promise<void>;
  verify: () => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  updateProfile: (data: EditProfileInput) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      register: async (data: RegisterInput) => {
        const res = await api.post('/auth/register', data);
        if (res.data.accessToken) {
          set({
            user: res.data.user || res.data.data || null,
            accessToken: res.data.accessToken,
            refreshToken: res.data.refreshToken,
            isAuthenticated: !!res.data.accessToken,
          });
          if (res.data.accessToken) {
            connectSocket(res.data.accessToken);
          }
        }
      },

      login: async (data: LoginInput) => {
        const res = await api.post('/auth/login', data);
        set({
          user: res.data.user || res.data.data || null,
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
          isAuthenticated: true,
        });
        if (res.data.accessToken) {
          connectSocket(res.data.accessToken);
        }
      },

      verify: async () => {
        const { accessToken } = get();
        if (!accessToken) {
          set({ isAuthenticated: false });
          return;
        }
        try {
          const res = await api.get('/auth/me');
          set({
            user: res.data.data || res.data.user || null,
            isAuthenticated: true,
          });
        } catch {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
        }
      },

      logout: () => {
        disconnectSocket();
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      refresh: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          set({ isAuthenticated: false });
          return;
        }
        try {
          const res = await api.post('/auth/refresh', { refreshToken });
          set({
            accessToken: res.data.accessToken,
            refreshToken: res.data.refreshToken || refreshToken,
          });
          if (res.data.accessToken) {
            connectSocket(res.data.accessToken);
          }
        } catch {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
        }
      },

      updateProfile: async (data: EditProfileInput) => {
        const res = await api.put('/auth/profile', data);
        set({
          user: res.data.data || res.data.user || get().user,
        });
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
