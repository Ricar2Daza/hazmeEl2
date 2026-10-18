import { io, Socket } from 'socket.io-client';
import { fetchNewTokens, getRefreshToken } from './axios';

let socket: Socket | null = null;

// Los componentes se montan ANTES de que AppLayout cree el socket (en React los
// efectos de los hijos corren antes que los del padre), así que un simple
// socket.on(...) en un useEffect se perdía en cada recarga completa de la
// página: los mensajes en tiempo real dejaban de llegar hasta navegar de nuevo.
// Guardamos los suscriptores en este registro y los volvemos a enganchar al
// socket cada vez que se crea uno.
type Listener = { event: string; cb: (data: any) => void };
const listeners = new Set<Listener>();

const attachListeners = (target: Socket) => {
  listeners.forEach((listener) => target.on(listener.event, listener.cb));
};

export const getSocket = (): Socket | null => socket;

// Evita que un fallo de autenticación dispare varias renovaciones seguidas.
let lastAuthRefreshAt = 0;

const refreshSocketToken = async (): Promise<string | null> => {
  const now = Date.now();
  if (now - lastAuthRefreshAt < 15000) return null;
  lastAuthRefreshAt = now;

  if (!getRefreshToken()) return null;

  try {
    const refreshed = await fetchNewTokens();
    return refreshed?.accessToken ?? null;
  } catch {
    return null;
  }
};

export const connectSocket = (accessToken: string): Socket => {
  // Reutilizamos la instancia existente: crear otra nueva dejaría sockets
  // huérfanos que se reconectan solos y duplican eventos.
  if (socket) {
    socket.auth = { token: `Bearer ${accessToken}` };
    if (!socket.connected) {
      socket.connect();
    }
    return socket;
  }

  // Conecta al mismo origen que sirvió la página (Vite proxea /socket.io).
  socket = io(window.location.origin, {
    auth: {
      token: `Bearer ${accessToken}`,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelayMax: 10000,
    timeout: 10000,
  });

  attachListeners(socket);

  socket.on('connect', () => {
    console.log('[Socket] Conectado');
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Desconectado:', reason);
    // El servidor puede cortar la conexión por token inválido; reintentamos
    // (con token nuevo en el handler de connect_error).
    if (reason === 'io server disconnect') {
      socket?.connect();
    }
  });

  socket.on('connect_error', (err) => {
    const message = String((err as any)?.message ?? '');
    console.error('[Socket] Error de conexión:', message);

    // El middleware del backend rechaza tokens caducados: renovamos el access
    // token y reconectamos. Sin esto, tras 1h de sesión abierta (o tras
    // recargar la página con un token viejo) el tiempo real moría en silencio.
    const authFailed = /token|autentic|jwt|401/i.test(message);
    if (!authFailed) return;

    void refreshSocketToken().then((freshToken) => {
      if (!freshToken || !socket) return;
      socket.auth = { token: `Bearer ${freshToken}` };
      socket.connect();
    });
  });

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const onSocketEvent = (
  event: string,
  callback: (data: any) => void
): (() => void) => {
  const listener: Listener = { event, cb: callback };
  listeners.add(listener);
  socket?.on(event, callback);

  return () => {
    listeners.delete(listener);
    socket?.off(event, callback);
  };
};
