import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/axios';
import { getSocket } from '@/lib/socket';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedJobId?: string | null;
  read: boolean;
  createdAt: string;
}

interface NotificationState {
  unreadCount: number;
  notifications: Notification[];
  fetchUnreadCount: () => Promise<void>;
  increment: () => void;
  reset: () => void;
  setNotifications: (notifications: Notification[]) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  setupSocketListeners: () => () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      unreadCount: 0,
      notifications: [],

      fetchUnreadCount: async () => {
        try {
          const res = await api.get('/notifications/unread-count');
          set({ unreadCount: res.data.data?.unreadCount ?? res.data.unreadCount ?? 0 });
        } catch {
          // ignore
        }
      },

      increment: () => {
        set((s) => ({ unreadCount: s.unreadCount + 1 }));
      },

      reset: () => {
        set({ unreadCount: 0 });
      },

      setNotifications: (notifications: Notification[]) => {
        set({ notifications });
      },

      markAsRead: async (id: string) => {
        try {
          await api.patch(`/notifications/${id}/read`);
          set((s) => ({
            notifications: s.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, s.unreadCount - 1),
          }));
        } catch {
          // ignore
        }
      },

      markAllRead: async () => {
        try {
          await api.patch('/notifications/read-all');
          set((s) => ({
            notifications: s.notifications.map((n) => ({ ...n, read: true })),
            unreadCount: 0,
          }));
        } catch {
          // ignore
        }
      },

      setupSocketListeners: () => {
        const socket = getSocket();
        if (!socket) return () => {};

        const cleanup1 = () => socket.off('new_application');
        const cleanup2 = () => socket.off('application_accepted');
        const cleanup3 = () => socket.off('application_rejected');

        return () => {
          cleanup1();
          cleanup2();
          cleanup3();
        };
      },
    }),
    {
      name: 'notification-store',
      partialize: (state) => ({
        unreadCount: state.unreadCount,
      }),
    }
  )
);
