import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket | null => socket;

export const connectSocket = (accessToken: string): Socket => {
  if (socket && socket.connected) {
    return socket;
  }

  // Conecta al mismo origen que sirvió la página (Vite proxea /socket.io).
  socket = io(window.location.origin, {
    auth: {
      token: `Bearer ${accessToken}`,
    },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('[Socket] Conectado');
  });

  socket.on('disconnect', () => {
    console.log('[Socket] Desconectado');
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] Error de conexión:', err.message);
  });

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const onSocketEvent = (event: string, callback: (data: any) => void): (() => void) => {
  if (!socket) return () => {};
  socket.on(event, callback);
  return () => {
    if (socket) socket.off(event, callback);
  };
};
