import { create } from 'zustand';

interface NotifState {
  unreadCount: number;
  setUnreadCount: (n: number) => void;
  incrementUnread: (n?: number) => void;
  decrementUnread: () => void;
  resetUnread: () => void;
}

export const useNotifStore = create<NotifState>((set, get) => ({
  unreadCount: 0,
  setUnreadCount: (n) => set({ unreadCount: n }),
  incrementUnread: (n = 1) => set({ unreadCount: get().unreadCount + n }),
  decrementUnread: () => set({ unreadCount: Math.max(0, get().unreadCount - 1) }),
  resetUnread: () => set({ unreadCount: 0 }),
}));
