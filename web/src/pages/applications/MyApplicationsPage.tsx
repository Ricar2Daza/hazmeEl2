import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, MessageCircle } from 'lucide-react';
import api from '@/lib/axios';

interface Application {
  id: string;
  applicantId: string;
  jobId: string;
  message?: string | null;
  status: 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';
  createdAt: string;
  job?: {
    id: string;
    title: string;
    description: string;
    budgetMin: number;
    budgetMax: number;
    deadlineDate: string;
    locationAddress: string;
    status: string;
    publisher?: {
      id: string;
      fullName: string;
      companyName?: string | null;
      email?: string;
    };
    category?: {
      id: string;
      name: string;
    };
  };
}

const statusBadge: Record<string, string> = {
  PENDIENTE: 'badge-yellow',
  ACEPTADA: 'badge-green',
  RECHAZADA: 'badge-red',
};

const statusText: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  ACEPTADA: 'Aceptada',
  RECHAZADA: 'Rechazada',
};

export default function MyApplicationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['myApplications'],
    queryFn: async (): Promise<Application[]> => {
      const res = await api.get('/applications/mine');
      return res.data.data || [];
    },
  });

  const applications = data || [];

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === 'PENDIENTE').length,
    accepted: applications.filter((a) => a.status === 'ACEPTADA').length,
    rejected: applications.filter((a) => a.status === 'RECHAZADA').length,
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase text-muted">Actividad</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">Mis postulaciones</h1>
        <p className="mt-1 text-sm text-ink-soft">Revisa el estado de tus propuestas</p>
      </div>

      <div className="grid grid-cols-12 gap-3 sm:gap-4">
        <div className="card col-span-6 lg:col-span-3">
          <p className="text-sm text-muted">Total</p>
          <p className="mt-1 text-2xl font-semibold text-ink">{stats.total}</p>
        </div>
        <div className="card col-span-6 lg:col-span-3">
          <p className="text-sm text-muted">Pendientes</p>
          <p className="mt-1 text-2xl font-semibold text-ink">{stats.pending}</p>
        </div>
        <div className="card col-span-6 lg:col-span-3">
          <p className="text-sm text-muted">Aceptadas</p>
          <p className="mt-1 text-2xl font-semibold text-ink">{stats.accepted}</p>
        </div>
        <div className="card col-span-6 lg:col-span-3">
          <p className="text-sm text-muted">Rechazadas</p>
          <p className="mt-1 text-2xl font-semibold text-ink">{stats.rejected}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-6 bg-line rounded w-3/4 mb-3" />
              <div className="h-4 bg-line rounded w-1/2 mb-2" />
              <div className="h-4 bg-line rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="card text-center py-16">
          <h3 className="text-lg font-semibold text-ink">Aún no te has postulado</h3>
          <p className="text-ink-soft max-w-md mx-auto mb-6">
            Explora los trabajos disponibles y encuentra la oportunidad perfecta para tus habilidades.
          </p>
          <Link to="/trabajos/buscar" className="btn-primary">
            Buscar trabajos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-3 sm:gap-4">
          {applications.map((app) => (
            <div key={app.id} className="card col-span-12">
              <div className="grid grid-cols-12 items-start gap-4">
                <div className="col-span-12 min-w-0 sm:col-span-8">
                  <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                    <Link
                      to={`/trabajos/${app.jobId}`}
                      className="line-clamp-2 text-lg font-semibold text-ink hover:text-link"
                    >
                      {app.job?.title || 'Trabajo'}
                    </Link>
                    <span className={`badge ${statusBadge[app.status]}`}>
                      {statusText[app.status]}
                    </span>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-muted">
                    {app.job?.category && (
                      <div>
                        <span>{app.job.category.name}</span>
                      </div>
                    )}
                    <div>
                      <span>${app.job?.budgetMin} - ${app.job?.budgetMax}</span>
                    </div>
                    <div>
                      <span className="line-clamp-1">{app.job?.locationAddress || '—'}</span>
                    </div>
                    <div>
                      <span>Límite: {app.job?.deadlineDate ? formatDate(app.job.deadlineDate) : '—'}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-500 text-xs font-semibold text-white">
                        {app.job?.publisher?.fullName?.charAt(0).toUpperCase() || 'P'}
                      </div>
                      <div>
                        <span className="text-muted">Publicado por: </span>
                        <span className="font-medium text-ink">
                          {app.job?.publisher?.fullName || '—'}
                        </span>
                        {app.job?.publisher?.companyName && (
                          <span className="text-muted"> ({app.job.publisher.companyName})</span>
                        )}
                      </div>
                    </div>
                    <span className="text-[13px] text-muted">
                      Postulado: {formatDate(app.createdAt)}
                    </span>
                  </div>

                  {app.status === 'ACEPTADA' && (
                    <div className="mt-4 rounded-lg border border-line p-4">
                      <p className="text-sm font-medium text-ink-mid">
                        Tu postulación fue aceptada.
                        {app.job?.publisher?.email && (
                          <> Contacta al publicante: <a href={`mailto:${app.job.publisher.email}`} className="underline font-semibold">{app.job.publisher.email}</a></>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                <div className="col-span-12 grid grid-cols-1 gap-2 sm:col-span-4 xl:grid-cols-2">
                  <Link to={`/mensajes/${app.id}`} className="btn-primary text-center">
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    Contactar
                  </Link>
                  <Link to={`/trabajos/${app.jobId}`} className="btn-secondary text-center">
                    <Briefcase className="h-4 w-4" aria-hidden="true" />
                    Ver trabajo
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
