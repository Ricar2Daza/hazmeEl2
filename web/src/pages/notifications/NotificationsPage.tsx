import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useNotificationStore, Notification } from '@/store/notificationStore';

const typeIcons: Record<string, string> = {
  NEW_APPLICATION: '📨',
  APPLICATION_ACCEPTED: '✅',
  APPLICATION_REJECTED: '❌',
  JOB_UPDATED: '📝',
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const {
    fetchUnreadCount,
    markAsRead,
    markAllRead,
    setNotifications,
  } = useNotificationStore();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async (): Promise<Notification[]> => {
      const res = await api.get('/notifications');
      const list = res.data.data || [];
      setNotifications(list);
      return list;
    },
  });

  const notifications = data || [];

  const markAllMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      markAllRead();
    },
  });

  const handleClick = async (notif: Notification) => {
    if (!notif.read) {
      markAsRead(notif.id);
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} d`;
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0
              ? `Tienes ${unreadCount} notificacione${unreadCount !== 1 ? 's' : ''} sin leer`
              : 'No tienes notificaciones sin leer'}
          </p>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending || unreadCount === 0}
            className="btn-secondary"
          >
            ✓ Marcar todas leídas
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-6xl mb-4">🔔</p>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay notificaciones</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            Aquí verás novedades sobre tus publicaciones y postulaciones.
          </p>
          <Link to="/trabajos/buscar" className="btn-primary">
            Explorar trabajos
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleClick(notif)}
              className={`card cursor-pointer transition-colors ${
                !notif.read ? 'bg-blue-50/50 border-primary-100' : 'bg-white'
              } hover:bg-gray-50`}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                  {typeIcons[notif.type] || '📢'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-medium ${!notif.read ? 'text-gray-900' : 'text-gray-700'}`}>
                      {notif.title}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!notif.read && (
                        <span className="w-2 h-2 bg-primary-600 rounded-full" />
                      )}
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(notif.createdAt)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                  {notif.relatedJobId && (
                    <Link
                      to={`/trabajos/${notif.relatedJobId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-primary-600 hover:underline mt-2 inline-block"
                    >
                      Ver trabajo →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
