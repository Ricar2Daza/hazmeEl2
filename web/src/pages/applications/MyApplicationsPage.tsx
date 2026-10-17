import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
  PENDIENTE: '⏳ Pendiente',
  ACEPTADA: '✅ Aceptada',
  RECHAZADA: '❌ Rechazada',
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis postulaciones</h1>
        <p className="text-gray-600 mt-1">Revisa el estado de tus postulaciones enviadas</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Aceptadas</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.accepted}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Rechazadas</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.rejected}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-6xl mb-4">📨</p>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Aún no te has postulado</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            Explora los trabajos disponibles y encuentra la oportunidad perfecta para tus habilidades.
          </p>
          <Link to="/trabajos/buscar" className="btn-primary">
            🔍 Buscar trabajos
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app.id} className="card">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                    <Link
                      to={`/trabajos/${app.jobId}`}
                      className="font-semibold text-gray-900 text-lg hover:text-primary-600 line-clamp-2 flex-1 mr-3"
                    >
                      {app.job?.title || 'Trabajo'}
                    </Link>
                    <span className={`badge ${statusBadge[app.status]}`}>
                      {statusText[app.status]}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600 mb-3">
                    {app.job?.category && (
                      <div className="flex items-center gap-1.5">
                        <span>🏷️</span>
                        <span>{app.job.category.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <span>💰</span>
                      <span>${app.job?.budgetMin} - ${app.job?.budgetMax}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>📍</span>
                      <span className="line-clamp-1">{app.job?.locationAddress || '—'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>⏰</span>
                      <span>Límite: {app.job?.deadlineDate ? formatDate(app.job.deadlineDate) : '—'}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 text-xs font-bold">
                        {app.job?.publisher?.fullName?.charAt(0).toUpperCase() || 'P'}
                      </div>
                      <div>
                        <span className="text-gray-500">Publicado por: </span>
                        <span className="font-medium text-gray-900">
                          {app.job?.publisher?.fullName || '—'}
                        </span>
                        {app.job?.publisher?.companyName && (
                          <span className="text-gray-500"> ({app.job.publisher.companyName})</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">|</span>
                    <span className="text-xs text-gray-500">
                      Postulado: {formatDate(app.createdAt)}
                    </span>
                  </div>

                  {app.status === 'ACEPTADA' && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                      <p className="text-green-800 font-medium text-sm">
                        🎉 ¡Felicidades! Tu postulación fue aceptada.
                        {app.job?.publisher?.email && (
                          <> Contacta al publicante: <a href={`mailto:${app.job.publisher.email}`} className="underline font-semibold">{app.job.publisher.email}</a></>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0">
                  <Link to={`/trabajos/${app.jobId}`} className="btn-secondary w-full lg:w-auto">
                    🔍 Ver trabajo
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
