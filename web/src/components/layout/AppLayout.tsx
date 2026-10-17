import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { connectSocket, onSocketEvent, getSocket } from '@/lib/socket';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/trabajos/buscar', label: 'Buscar trabajos', icon: '🔍' },
  { to: '/trabajos/publicar', label: 'Publicar trabajo', icon: '📝' },
  { to: '/mis-publicaciones', label: 'Mis publicaciones', icon: '📋' },
  { to: '/mis-postulaciones', label: 'Mis postulaciones', icon: '📨' },
  { to: '/perfil', label: 'Perfil', icon: '👤' },
  { to: '/notificaciones', label: 'Notificaciones', icon: '🔔' },
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
    }
  }, [isAuthenticated, accessToken]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const socket = getSocket();
    if (!socket) return;

    const off1 = onSocketEvent('new_application', (data: any) => {
      toast.success(`Nueva postulación en tu trabajo: ${data?.jobTitle || data?.title || ''}`);
      increment();
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs', 'mine'] });
    });

    const off2 = onSocketEvent('application_accepted', (data: any) => {
      toast.success(`Tu postulación en ${data?.jobTitle || ''} fue ACEPTADA 🎉`);
      increment();
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
    });

    const off3 = onSocketEvent('application_rejected', (data: any) => {
      toast.error(`Tu postulación en ${data?.jobTitle || ''} fue rechazada`);
      increment();
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
    });

    return () => {
      if (typeof off1 === 'function') off1();
      if (typeof off2 === 'function') off2();
      if (typeof off3 === 'function') off3();
    };
  }, [isAuthenticated, accessToken, queryClient]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 mr-2"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Link to="/dashboard" className="flex items-center">
                <span className="text-2xl font-bold text-primary-600">HazMe</span>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/notificaciones"
                className="relative p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {user?.fullName || 'Usuario'}
                  </span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    <Link
                      to="/perfil"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Mi perfil
                    </Link>
                    <Link
                      to="/mis-publicaciones"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Mis publicaciones
                    </Link>
                    <Link
                      to="/mis-postulaciones"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Mis postulaciones
                    </Link>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 fixed md:sticky top-16 left-0 z-30 w-64 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-transform duration-300 overflow-y-auto`}
        >
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
            <div className="pt-4 mt-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <span className="text-lg">🚪</span>
                Cerrar sesión
              </button>
            </div>
          </nav>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
