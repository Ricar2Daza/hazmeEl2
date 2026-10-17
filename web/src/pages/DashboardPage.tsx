import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: string;
  color: string;
  to?: string;
}

function StatCard({ title, value, icon, color, to }: StatCardProps) {
  const content = (
    <div className="card hover:-translate-y-1 transition-transform cursor-pointer">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center text-3xl`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (to) {
    return <Link to={to}>{content}</Link>;
  }
  return content;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();

  const { data: myJobs } = useQuery({
    queryKey: ['myJobs'],
    queryFn: async () => {
      const res = await api.get('/jobs/mine');
      return res.data.data || [];
    },
  });

  const { data: myApplications } = useQuery({
    queryKey: ['myApplications'],
    queryFn: async () => {
      const res = await api.get('/applications/mine');
      return res.data.data || [];
    },
  });

  const { data: notificationsCount } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: async () => {
      const res = await api.get('/notifications/unread-count');
      fetchUnreadCount();
      return res.data.data?.unreadCount ?? res.data.unreadCount ?? 0;
    },
  });

  const jobsCount = myJobs?.length ?? 0;
  const appsCount = myApplications?.length ?? 0;
  const notifCount = notificationsCount ?? unreadCount;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Hola, {user?.fullName?.split(' ')[0] || 'Usuario'} 👋
        </h1>
        <p className="text-gray-600 mt-1">Bienvenido a tu panel de control</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Mis publicaciones"
          value={jobsCount}
          icon="📋"
          color="bg-blue-100"
          to="/mis-publicaciones"
        />
        <StatCard
          title="Mis postulaciones"
          value={appsCount}
          icon="📨"
          color="bg-green-100"
          to="/mis-postulaciones"
        />
        <StatCard
          title="Notificaciones sin leer"
          value={notifCount}
          icon="🔔"
          color="bg-yellow-100"
          to="/notificaciones"
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Accesos rápidos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/trabajos/buscar" className="card hover:-translate-y-1 transition-transform">
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="font-semibold text-gray-900">Buscar trabajos</h3>
            <p className="text-sm text-gray-500 mt-1">Explora oportunidades disponibles</p>
          </Link>
          <Link to="/trabajos/publicar" className="card hover:-translate-y-1 transition-transform">
            <div className="text-3xl mb-3">📝</div>
            <h3 className="font-semibold text-gray-900">Publicar trabajo</h3>
            <p className="text-sm text-gray-500 mt-1">Crea una nueva publicación</p>
          </Link>
          <Link to="/mis-publicaciones" className="card hover:-translate-y-1 transition-transform">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-semibold text-gray-900">Ver publicaciones</h3>
            <p className="text-sm text-gray-500 mt-1">Gestiona tus trabajos activos</p>
          </Link>
          <Link to="/perfil" className="card hover:-translate-y-1 transition-transform">
            <div className="text-3xl mb-3">👤</div>
            <h3 className="font-semibold text-gray-900">Editar perfil</h3>
            <p className="text-sm text-gray-500 mt-1">Actualiza tu información</p>
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Últimas publicaciones</h3>
            <Link to="/mis-publicaciones" className="text-sm text-primary-600 hover:underline">
              Ver todas →
            </Link>
          </div>
          {jobsCount === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-4xl mb-2">📭</p>
              <p>Aún no has publicado trabajos</p>
              <Link to="/trabajos/publicar" className="btn-primary mt-4">
                Publicar el primero
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myJobs?.slice(0, 3).map((job: any) => (
                <div key={job.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{job.title}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        ${job.budgetMin} - ${job.budgetMax}
                      </p>
                    </div>
                    <span className={`badge ${
                      job.status === 'ABIERTO' ? 'badge-green' :
                      job.status === 'EN_PROGRESO' ? 'badge-blue' :
                      job.status === 'FINALIZADO' ? 'badge-gray' : 'badge-red'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Mis últimas postulaciones</h3>
            <Link to="/mis-postulaciones" className="text-sm text-primary-600 hover:underline">
              Ver todas →
            </Link>
          </div>
          {appsCount === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-4xl mb-2">💼</p>
              <p>Aún no te has postulado a ningún trabajo</p>
              <Link to="/trabajos/buscar" className="btn-primary mt-4">
                Buscar oportunidades
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myApplications?.slice(0, 3).map((app: any) => (
                <div key={app.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{app.job?.title || 'Trabajo'}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Publicado por {app.job?.publisher?.fullName || '—'}
                      </p>
                    </div>
                    <span className={`badge ${
                      app.status === 'PENDIENTE' ? 'badge-yellow' :
                      app.status === 'ACEPTADA' ? 'badge-green' : 'badge-red'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
