import axios from 'axios';

const getAccessToken = (): string | null => {
  try {
    const stored = localStorage.getItem('auth-store');
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed.state?.accessToken || parsed.accessToken || null;
  } catch {
    return null;
  }
};

const getRefreshToken = (): string | null => {
  try {
    const stored = localStorage.getItem('auth-store');
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed.state?.refreshToken || parsed.refreshToken || null;
  } catch {
    return null;
  }
};

const setTokens = (accessToken: string, refreshToken: string) => {
  try {
    const stored = localStorage.getItem('auth-store');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.state) {
        parsed.state.accessToken = accessToken;
        parsed.state.refreshToken = refreshToken;
      } else {
        parsed.accessToken = accessToken;
        parsed.refreshToken = refreshToken;
      }
      localStorage.setItem('auth-store', JSON.stringify(parsed));
    }
  } catch {
    // ignore
  }
};

const clearAuth = () => {
  try {
    localStorage.removeItem('auth-store');
  } catch {
    // ignore
  }
};

const api = axios.create({
  // Ruta relativa: se resuelve contra el origen actual (localhost:5173 o el
  // dominio del túnel) y Vite la proxea al backend. Así el MVP es compartible
  // sin depender de localhost.
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const isAuthEndpoint = (url?: string) =>
  !!url && /\/(auth\/)?(login|register|verify|refresh)\b/.test(url);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // En endpoints de autenticación un 401 es un error real (credenciales
    // inválidas), no una sesión expirada: hay que mostrarlo, no refrescar ni
    // recargar la página (eso ocultaba el mensaje "Email o contraseña incorrectos").
    if (isAuthEndpoint(originalRequest?.url)) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        clearAuth();
        isRefreshing = false;
        processQueue(new Error('No refresh token'), null);
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          '/api/auth/refresh',
          { refreshToken }
        );

        const { accessToken: newAccess, refreshToken: newRefresh } = response.data;
        setTokens(newAccess, newRefresh ?? refreshToken);
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        processQueue(null, newAccess);
        return api(originalRequest);
      } catch (refreshError) {
        clearAuth();
        processQueue(refreshError, null);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const chatApi = {
  conversations: () => api.get('/chat/conversations'),
  messages: (applicationId: string) => api.get(`/chat/${applicationId}/messages`),
  send: (applicationId: string, content: string) =>
    api.post(`/chat/${applicationId}/messages`, { content }),
};

/** Mensajería directa entre usuarios (sin postulación de por medio). */
export const directApi = {
  conversations: () => api.get('/direct/conversations'),
  start: (userId: string) => api.post('/direct/conversations', { userId }),
  messages: (conversationId: string) => api.get(`/direct/conversations/${conversationId}/messages`),
  send: (conversationId: string, content: string) =>
    api.post(`/direct/conversations/${conversationId}/messages`, { content }),
};

/** Valoraciones de usuarios (reputación). */
export const ratingsApi = {
  list: (userId: string) => api.get(`/users/${userId}/ratings`),
  upsert: (userId: string, score: number, comment?: string) =>
    api.post(`/users/${userId}/ratings`, { score, comment }),
};

export default api;
