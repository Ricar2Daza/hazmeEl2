import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, PlusCircle, Search, User } from 'lucide-react';
import api from '@/lib/axios';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';

interface StatCardProps {
  title: string;
  value: number | string;
  to?: string;
  className?: string;
}

function StatCard({ title, value, to, className = '' }: StatCardProps) {
  const card = (
    <div className="card grid min-h-28 grid-cols-12 items-end gap-3 transition-colors hover:border-line-strong active:border-line-strong">
      <div className="col-span-8">
        <p className="text-sm font-medium text-ink-soft">{title}</p>
      </div>
      <p className="col-span-4 text-right text-3xl font-semibold text-ink">{value}</p>
    </div>
  );

  if (to) {
    return (
      <Link
        to={to}
        className={`rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${className}`}
      >
        {card}
      </Link>
    );
  }
  return <div className={className}>{card}</div>;
}

const quickLinks = [
  { to: '/trabajos/buscar', title: 'Buscar trabajos', description: 'Explora oportunidades disponibles', icon: Search },
  { to: '/trabajos/publicar', title: 'Publicar trabajo', description: 'Crea una nueva publicación', icon: PlusCircle },
  { to: '/mis-publicaciones', title: 'Ver publicaciones', description: 'Gestiona tus trabajos activos', icon: ClipboardList },
  { to: '/perfil', title: 'Editar perfil', description: 'Actualiza tu información', icon: User },
];

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
        <p className="text-xs font-medium uppercase text-muted">Panel</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">
          Hola, {user?.fullName?.split(' ')[0] || 'Usuario'}
        </h1>
        <p className="text-ink-soft mt-1">Bienvenido a tu panel de control</p>
      </div>

      <div className="grid grid-cols-12 gap-3 sm:gap-4">
        <StatCard
          title="Mis publicaciones"
          value={jobsCount}
          to="/mis-publicaciones"
          className="col-span-12 sm:col-span-6 xl:col-span-4"
        />
        <StatCard
          title="Mis postulaciones"
          value={appsCount}
          to="/mis-postulaciones"
          className="col-span-12 sm:col-span-6 xl:col-span-4"
        />
        <StatCard
          title="Notificaciones sin leer"
          value={notifCount}
          to="/notificaciones"
          className="col-span-12 sm:col-span-6 xl:col-span-4"
        />
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-ink">Accesos rápidos</h2>
        <div className="grid grid-cols-12 gap-3 sm:gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                className="card col-span-12 transition-colors hover:border-line-strong active:border-line-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 sm:col-span-6 xl:col-span-3"
              >
                <Icon className="h-6 w-6 text-accent-500" aria-hidden="true" />
                <h3 className="mt-3 text-base font-semibold text-ink">{link.title}</h3>
                <p className="mt-2 text-sm text-muted">{link.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="card col-span-12 lg:col-span-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-ink">Últimas publicaciones</h3>
              <Link to="/mis-publicaciones" className="text-sm font-medium text-link hover:underline">
              Ver todas →
            </Link>
          </div>
          {jobsCount === 0 ? (
            <div className="text-center py-8 text-muted">
              <p>Aún no has publicado trabajos</p>
              <Link to="/trabajos/publicar" className="btn-primary mt-4">
                Publicar el primero
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-line border-t border-line">
              {myJobs?.slice(0, 3).map((job: any) => (
                <div key={job.id} className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink truncate">{job.title}</p>
                      <p className="text-sm text-muted mt-1">
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

        <div className="card col-span-12 lg:col-span-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-ink">Mis últimas postulaciones</h3>
              <Link to="/mis-postulaciones" className="text-sm font-medium text-link hover:underline">
              Ver todas →
            </Link>
          </div>
          {appsCount === 0 ? (
            <div className="text-center py-8 text-muted">
              <p>Aún no te has postulado a ningún trabajo</p>
              <Link to="/trabajos/buscar" className="btn-primary mt-4">
                Buscar oportunidades
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-line border-t border-line">
              {myApplications?.slice(0, 3).map((app: any) => (
                <div key={app.id} className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink truncate">{app.job?.title || 'Trabajo'}</p>
                      <p className="text-sm text-muted mt-1">
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
