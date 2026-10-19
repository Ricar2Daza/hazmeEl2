import axios from 'axios';

/** Dispara el evento con el que la store se sincroniza tras una renovación. */
const notifyTokensRefreshed = (accessToken: string, refreshToken: string) => {
  try {
    window.dispatchEvent(
      new CustomEvent('auth:tokens-refreshed', {
        detail: { accessToken, refreshToken },
      })
    );
  } catch {
    // ignore (no hay window, p. ej. en entornos de test)
  }
};

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

export const getRefreshToken = (): string | null => {
  try {
    const stored = localStorage.getItem('auth-store');
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed.state?.refreshToken || parsed.refreshToken || null;
  } catch {
    return null;
  }
};

export const setTokens = (accessToken: string, refreshToken: string) => {
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
    // Avisamos a la store (zustand) para que su estado en memoria no se quede
    // con un access token caducado: si no, el socket se reconectaría con un
    // token viejo y el tiempo real moriría hasta volver a entrar.
    notifyTokensRefreshed(accessToken, refreshToken);
  } catch {
    // ignore
  }
};

// ngrok interrumpe con una página de aviso a los clientes que no parecen
// navegadores y puede devolver HTML (200) en lugar de JSON, lo que rompe el
// parseo. Si servimos desde un túnel, lo indicamos para saltarnos el aviso.
const isTunnelOrigin =
  typeof window !== 'undefined' &&
  /(^|\.)ngrok(-free)?\.(dev|app)$/.test(window.location.hostname);

/**
 * Pide un par nuevo de tokens al backend.
 *
 * - Devuelve `null` cuando no hay con qué renovar la sesión (sin refresh token
 *   o respuesta sin tokens).
 * - Propaga el error HTTP si el backend responde 4xx/5xx, para que quien llame
 *   pueda distinguir "la sesión caducó" de "no hay red ahora mismo".
 */
export const fetchNewTokens = async (): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  // axios "crudo" (sin interceptores) para no entrar en bucles de renovación.
  const response = await axios.post(
    '/api/auth/refresh',
    { refreshToken },
    isTunnelOrigin ? { headers: { 'ngrok-skip-browser-warning': 'true' } } : undefined
  );
  const accessToken = response.data?.accessToken;
  if (!accessToken) return null;

  const newRefresh = response.data?.refreshToken || refreshToken;
  setTokens(accessToken, newRefresh);
  return { accessToken, refreshToken: newRefresh };
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
    if (isTunnelOrigin) {
      config.headers['ngrok-skip-browser-warning'] = 'true';
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
        // fetchNewTokens propaga el error HTTP: así sabemos si la sesión
        // realmente caducó o si el backend simplemente no está respondiendo.
        const refreshed = await fetchNewTokens();
        if (!refreshed) {
          throw Object.assign(new Error('No se pudo renovar la sesión'), {
            response: { status: 401 },
          });
        }
        originalRequest.headers.Authorization = `Bearer ${refreshed.accessToken}`;
        processQueue(null, refreshed.accessToken);
        return api(originalRequest);
      } catch (refreshError: any) {
        processQueue(refreshError, null);

        const status = refreshError?.response?.status;

        // 401/403 del endpoint de refresh => el refresh token ya no sirve y hay
        // que salir. Cualquier otro fallo (túnel cayéndose, backend
        // reiniciándose, sin red) es transitorio: mantenemos la sesión guardada
        // para que el usuario no sea expulsado por un corte momentáneo.
        if (status === 401 || status === 403) {
          clearAuth();
          window.location.href = '/login';
        } else {
          console.warn(
            '[Auth] No se pudo renovar la sesión (fallo transitorio); se reintentará en la próxima petición.'
          );
        }
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
  receipts: (applicationId: string, state: 'delivered' | 'read') =>
    api.post(`/chat/${applicationId}/receipts`, { state }),
};

/** Mensajería directa entre usuarios (sin postulación de por medio). */
export const directApi = {
  conversations: () => api.get('/direct/conversations'),
  start: (userId: string) => api.post('/direct/conversations', { userId }),
  messages: (conversationId: string) => api.get(`/direct/conversations/${conversationId}/messages`),
  send: (conversationId: string, content: string) =>
    api.post(`/direct/conversations/${conversationId}/messages`, { content }),
  receipts: (conversationId: string, state: 'delivered' | 'read') =>
    api.post(`/direct/conversations/${conversationId}/receipts`, { state }),
};

/** Valoraciones de usuarios (reputación). */
export const ratingsApi = {
  list: (userId: string) => api.get(`/users/${userId}/ratings`),
  upsert: (userId: string, score: number, comment?: string) =>
    api.post(`/users/${userId}/ratings`, { score, comment }),
};

export default api;
