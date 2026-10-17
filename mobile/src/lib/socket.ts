import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../constants';
import { getAccessToken } from './secureStorage';
import * as Notifications from 'expo-notifications';

let socket: Socket | null = null;

export async function initSocket() {
  const token = await getAccessToken();
  if (!token) return;
  if (socket && socket.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Conectado');
  });

  socket.on('disconnect', () => {
    console.log('[Socket] Desconectado');
  });

  socket.on('connect_error', (err) => {
    console.log('[Socket] Error conexión:', err.message);
  });

  return socket;
}

export function setupSocketListeners(
  onNewApplication: () => void,
  onApplicationAccepted: () => void,
  onApplicationRejected: () => void
) {
  if (!socket) return;

  socket.on('new_application', async (data: any) => {
    console.log('[Socket] new_application:', data);
    onNewApplication();
    await showLocalNotification(
      data?.title || 'Nueva postulación',
      data?.message || 'Han aplicado a tu trabajo'
    );
  });

  socket.on('application_accepted', async (data: any) => {
    console.log('[Socket] application_accepted:', data);
    onApplicationAccepted();
    await showLocalNotification(
      data?.title || 'Postulación aceptada 🎉',
      data?.message || 'Tu postulación fue aceptada'
    );
  });

  socket.on('application_rejected', async (data: any) => {
    console.log('[Socket] application_rejected:', data);
    onApplicationRejected();
    await showLocalNotification(
      data?.title || 'Postulación rechazada',
      data?.message || 'Tu postulación fue rechazada'
    );
  });

  socket.on('job_status_updated', async (data: any) => {
    console.log('[Socket] job_status_updated:', data);
    await showLocalNotification(
      data?.title || 'Trabajo actualizado',
      data?.message || 'Se actualizó el estado de un trabajo'
    );
  });
}

async function showLocalNotification(title: string, body: string) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: null,
    });
  } catch (e) {
    console.log('Error notif local:', e);
  }
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}
