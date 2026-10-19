import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/axios';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { connectMqtt, disconnectMqtt } from '@/lib/mqtt';
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
  createdAt?: string;
  updatedAt?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  register: (data: RegisterInput) => Promise<any>;
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
        // El backend sólo pide nombre, email, contraseña y teléfono: la
        // confirmación es validación de la interfaz, no datos a enviar.
        const { confirmPassword: _confirmPassword, ...payload } = data;
        const res = await api.post('/auth/register', payload);
        if (res.data.accessToken) {
          const registeredUser = res.data.user || res.data.data || null;
          set({
            user: registeredUser,
            accessToken: res.data.accessToken,
            refreshToken: res.data.refreshToken,
            isAuthenticated: !!res.data.accessToken,
          });
          connectSocket(res.data.accessToken);
          if (registeredUser?.id) connectMqtt(res.data.accessToken, registeredUser.id);
        }
        // Devolvemos la respuesta para que la UI sepa si pide verificación.
        return res.data;
      },

      login: async (data: LoginInput) => {
        const res = await api.post('/auth/login', data);
        const loggedUser = res.data.user || res.data.data || null;
        set({
          user: loggedUser,
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
          isAuthenticated: true,
        });
        if (res.data.accessToken) {
          connectSocket(res.data.accessToken);
          if (loggedUser?.id) connectMqtt(res.data.accessToken, loggedUser.id);
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
        } catch (error: any) {
          const status = error?.response?.status;
          // 401/403: el backend rechazó la sesión (el interceptor ya intentó
          // refrescarla). Otros errores son de red/servidor: no cerramos la
          // sesión por un corte puntual del túnel o del backend.
          if (status === 401 || status === 403) {
            set({
              user: null,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
            });
          } else {
            console.warn(
              '[Auth] No se pudo verificar la sesión (fallo transitorio); se mantiene la sesión local.'
            );
          }
        }
      },

      logout: () => {
        disconnectSocket();
        disconnectMqtt();
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
            const { user } = get();
            if (user?.id) connectMqtt(res.data.accessToken, user.id);
          }
        } catch (error: any) {
          const status = error?.response?.status;
          if (status === 401 || status === 403) {
            set({
              user: null,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
            });
          }
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

// El interceptor de axios renueva los tokens por su cuenta (y el socket lo hace
// cuando rechazan su token), pero el estado en memoria de esta store se quedaría
// con el access token caducado: al reconectar, el backend lo rechazaría otra vez
// y el tiempo real moriría hasta volver a entrar. Sincronizamos aquí.
if (typeof window !== 'undefined') {
  window.addEventListener('auth:tokens-refreshed', (event) => {
    const detail = (event as CustomEvent).detail as
      | { accessToken?: string; refreshToken?: string }
      | undefined;
    const accessToken = detail?.accessToken;
    if (!accessToken) return;

    const current = useAuthStore.getState();
    if (!current.isAuthenticated) return;

    useAuthStore.setState({
      accessToken,
      refreshToken: detail?.refreshToken || current.refreshToken,
    });
    connectSocket(accessToken);
    if (current.user?.id) connectMqtt(accessToken, current.user.id);
  });
}
