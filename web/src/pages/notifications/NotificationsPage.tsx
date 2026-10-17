import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import api from '@/lib/axios';
import { useNotificationStore, Notification } from '@/store/notificationStore';

const typeLabels: Record<string, string> = {
  NEW_APPLICATION: 'Postulación',
  APPLICATION_ACCEPTED: 'Aceptada',
  APPLICATION_REJECTED: 'Rechazada',
  JOB_UPDATED: 'Trabajo',
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Notificaciones</h1>
          <p className="mt-1 text-ink-soft">
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
            <CheckCheck className="h-4 w-4" aria-hidden="true" />
            Marcar todas leídas
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-line rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-line rounded w-3/4" />
                  <div className="h-3 bg-line rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card py-16 text-center">
          <Bell className="mx-auto mb-4 h-10 w-10 text-muted" aria-hidden="true" />
          <h3 className="mb-2 text-lg font-semibold text-ink">No hay notificaciones</h3>
          <p className="mx-auto mb-6 max-w-md text-ink-soft">
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
              className={`card cursor-pointer transition-colors hover:bg-subtle ${
                !notif.read ? 'border-l-2 border-l-accent-500' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium uppercase text-muted">
                        {typeLabels[notif.type] || 'Aviso'}
                      </p>
                      <p className={`mt-0.5 font-medium ${!notif.read ? 'text-ink' : 'text-ink-soft'}`}>
                        {notif.title}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {!notif.read && (
                        <span className="h-2 w-2 rounded-full bg-accent-500" aria-label="Sin leer" />
                      )}
                      <span className="whitespace-nowrap text-xs text-muted">
                        {formatDate(notif.createdAt)}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-ink-soft">{notif.message}</p>
                  {notif.relatedJobId && (
                    <Link
                      to={`/trabajos/${notif.relatedJobId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-2 inline-block text-xs hover:underline"
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
