import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Bell,
  Briefcase,
  ClipboardList,
  LogOut,
  Menu,
  MessageSquare,
  PlusCircle,
  Rss,
  Search,
  User,
  Users,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { connectSocket, onSocketEvent, getSocket } from '@/lib/socket';
import { connectMqtt, onMqttTopic, topics } from '@/lib/mqtt';
import { postReceipt } from '@/lib/receipts';
import Logo from '@/components/ui/Logo';
import ThemeToggle from '@/components/ui/ThemeToggle';

const navItems = [
  { to: '/feed', label: 'Feed', icon: Rss },
  { to: '/dashboard', label: 'Inicio', icon: Briefcase },
  { to: '/trabajos/buscar', label: 'Buscar trabajos', icon: Search },
  { to: '/usuarios', label: 'Buscar personas', icon: Users },
  { to: '/trabajos/publicar', label: 'Publicar trabajo', icon: PlusCircle },
  { to: '/mis-publicaciones', label: 'Mis publicaciones', icon: ClipboardList },
  { to: '/mis-postulaciones', label: 'Mis postulaciones', icon: ClipboardList },
  { to: '/mensajes', label: 'Mensajes', icon: MessageSquare },
  { to: '/mensajes/directos', label: 'Mensajes directos', icon: Users },
  { to: '/perfil', label: 'Perfil', icon: User },
  { to: '/notificaciones', label: 'Notificaciones', icon: Bell },
];

const mobileItems = [
  { to: '/feed', label: 'Feed', icon: Rss },
  { to: '/trabajos/buscar', label: 'Buscar', icon: Search },
  { to: '/trabajos/publicar', label: 'Publicar', icon: PlusCircle },
  { to: '/mensajes', label: 'Mensajes', icon: MessageSquare },
  { to: '/mensajes/directos', label: 'Directos', icon: Users },
  { to: '/mis-postulaciones', label: 'Actividad', icon: ClipboardList },
];

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, isAuthenticated, logout, accessToken, verify } = useAuthStore();
  const { unreadCount, fetchUnreadCount, increment } = useNotificationStore();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      verify();
      fetchUnreadCount();
      if (!getSocket()?.connected) {
        connectSocket(accessToken);
      }
      // Broker MQTT (mismo backend): la web usa Socket.io para avisos y MQTT
      // para pub/sub de chats (mensajes, tipado y recibos). Idempotente.
      if (user?.id) connectMqtt(accessToken, user.id);
    }
  }, [isAuthenticated, accessToken, user?.id]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    // Buzón MQTT personal: en cuanto el dispositivo recibe un mensaje (aunque
    // la conversación no esté abierta) confirma la entrega al servidor.
    return onMqttTopic(topics.inbox(user.id), (_topic, payload) => {
      if (payload?.type !== 'message' || !payload?.chatId) return;
      if (payload.message?.senderId === user.id) return; // eco de mis envíos
      postReceipt(payload.kind === 'chat' ? 'chat' : 'direct', payload.chatId, 'delivered');
      queryClient.invalidateQueries({ queryKey: ['directConversations'] });
      queryClient.invalidateQueries({ queryKey: ['chatConversations'] });
    });
  }, [isAuthenticated, user?.id, queryClient]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    // No comprobamos aquí si el socket existe: onSocketEvent registra en un
    // registro que se engancha al socket en cuanto se cree (los efectos de los
    // hijos corren antes que los de AppLayout, así que en una recarga el socket
    // aún no existe cuando la página de mensajes pide sus eventos).
    const off1 = onSocketEvent('new_application', (data: any) => {
      toast.success(`Nueva postulación en tu trabajo: ${data?.jobTitle || data?.title || ''}`);
      increment();
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs', 'mine'] });
    });

    const off2 = onSocketEvent('application_accepted', (data: any) => {
      toast.success(`Tu postulación en ${data?.jobTitle || ''} fue aceptada`);
      increment();
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
    });

    const off3 = onSocketEvent('application_rejected', (data: any) => {
      toast.error(`Tu postulación en ${data?.jobTitle || ''} fue rechazada`);
      increment();
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
    });

    const off4 = onSocketEvent('direct_message', (data: any) => {
      if (data?.senderId !== user?.id) {
        toast.success(`Nuevo mensaje directo de ${data?.sender?.fullName || 'alguien'}`);
      }
      queryClient.invalidateQueries({ queryKey: ['directConversations'] });
      queryClient.invalidateQueries({ queryKey: ['directMessages', data?.conversationId] });
    });

    return () => {
      if (typeof off1 === 'function') off1();
      if (typeof off2 === 'function') off2();
      if (typeof off3 === 'function') off3();
      if (typeof off4 === 'function') off4();
    };
  }, [isAuthenticated, accessToken, queryClient, user?.id]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-bg">
      <nav className="fixed inset-x-0 top-0 z-40 border-b border-line bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <button
                aria-label={sidebarOpen ? 'Cerrar navegación' : 'Abrir navegación'}
                aria-expanded={sidebarOpen}
                className="grid min-h-10 w-10 shrink-0 place-items-center rounded-lg text-ink-mid transition-colors hover:bg-subtle md:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <Logo size="sm" />
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <Link
                to="/notificaciones"
                aria-label="Notificaciones"
                className="relative grid h-10 w-10 place-items-center rounded-lg text-ink-mid transition-colors hover:bg-subtle hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <Bell className="h-5 w-5" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-semibold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-label="Menú de usuario"
                  aria-expanded={dropdownOpen}
                  className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-500 text-sm font-medium text-white">
                    {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                  </span>
                  <span className="hidden max-w-32 truncate text-sm font-medium text-ink-soft sm:block">
                    {user?.fullName || 'Usuario'}
                  </span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-line bg-card py-2">
                    <Link
                      to="/perfil"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-ink-soft transition-colors hover:bg-subtle"
                    >
                      Mi perfil
                    </Link>
                    <Link
                      to="/mis-publicaciones"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-ink-soft transition-colors hover:bg-subtle"
                    >
                      Mis publicaciones
                    </Link>
                    <Link
                      to="/mis-postulaciones"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-ink-soft transition-colors hover:bg-subtle"
                    >
                      Mis postulaciones
                    </Link>
                    <div className="my-1 border-t border-line" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-ink-soft transition-colors hover:bg-subtle"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-14">
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed left-0 top-14 z-30 h-[calc(100vh-3.5rem)] w-60 overflow-y-auto border-r border-line bg-card transition-transform duration-200 md:sticky md:translate-x-0`}
        >
          <nav aria-label="Navegación principal" className="space-y-1 p-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-accent-50 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400'
                      : 'text-ink-soft hover:bg-subtle hover:text-ink'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
            <div className="mt-4 border-t border-line pt-4">
              <button
                onClick={handleLogout}
                className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-ink-soft transition-colors hover:bg-subtle hover:text-ink"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Cerrar sesión
              </button>
            </div>
          </nav>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <main className="min-w-0 flex-1 px-4 pb-24 pt-5 sm:px-6 sm:pt-8 md:pb-8 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      <nav
        aria-label="Navegación móvil"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {mobileItems.map((item) => {
          const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-center text-[11px] font-medium transition-colors ${
                isActive ? 'text-accent-600 dark:text-accent-400' : 'text-muted'
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
