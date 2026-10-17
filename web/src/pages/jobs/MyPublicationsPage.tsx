import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

interface Job {
  id: string;
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  deadlineDate: string;
  status: 'ABIERTO' | 'EN_PROGRESO' | 'FINALIZADO' | 'CANCELADO';
  category?: { id: string; name: string };
  applications?: Array<{ id: string }>;
  _count?: { applications?: number };
  createdAt: string;
}

const statusBadge: Record<string, string> = {
  ABIERTO: 'badge-green',
  EN_PROGRESO: 'badge-blue',
  FINALIZADO: 'badge-gray',
  CANCELADO: 'badge-red',
};

export default function MyPublicationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['myJobs'],
    queryFn: async (): Promise<Job[]> => {
      const res = await api.get('/jobs/mine');
      return res.data.data || [];
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/jobs/${id}`),
    onSuccess: () => {
      toast.success('Trabajo cancelado');
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Error al cancelar');
    },
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const jobs = data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis publicaciones</h1>
          <p className="text-gray-600 mt-1">Gestiona los trabajos que has publicado</p>
        </div>
        <Link to="/trabajos/publicar" className="btn-primary whitespace-nowrap">
          + Nuevo trabajo
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-4" />
              <div className="flex gap-2">
                <div className="h-10 bg-gray-200 rounded flex-1" />
                <div className="h-10 bg-gray-200 rounded flex-1" />
              </div>
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-6xl mb-4">📋</p>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Aún no tienes publicaciones</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Publica tu primer trabajo y empieza a recibir postulaciones de profesionales calificados.
          </p>
          <Link to="/trabajos/publicar" className="btn-primary">
            📢 Publicar primer trabajo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((job) => {
            const appsCount = job._count?.applications ?? job.applications?.length ?? 0;
            return (
              <div key={job.id} className="card flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
                    <Link to={`/trabajos/${job.id}`} className="hover:text-primary-600">
                      {job.title}
                    </Link>
                  </h3>
                  <span className={`badge whitespace-nowrap ${statusBadge[job.status]}`}>
                    {job.status}
                  </span>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2 mb-4">{job.description}</p>

                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1.5">
                    <span>💰</span>
                    <span>${job.budgetMin} - ${job.budgetMax}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>⏰</span>
                    <span>{formatDate(job.deadlineDate)}</span>
                  </div>
                  {job.category && (
                    <div className="flex items-center gap-1.5">
                      <span>🏷️</span>
                      <span>{job.category.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span>👥</span>
                    <span className="font-medium">{appsCount} postulantes</span>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-100 grid grid-cols-3 gap-2">
                  <Link
                    to={`/trabajos/${job.id}/editar`}
                    className="btn-secondary text-xs py-2 px-2"
                  >
                    ✏️ Editar
                  </Link>
                  <Link
                    to={`/mis-publicaciones/${job.id}/postulantes`}
                    className="btn-primary text-xs py-2 px-2"
                  >
                    👥 Postulantes
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm('¿Seguro que deseas cancelar este trabajo?')) {
                        cancelMutation.mutate(job.id);
                      }
                    }}
                    disabled={job.status === 'CANCELADO' || cancelMutation.isPending}
                    className="btn-danger text-xs py-2 px-2"
                  >
                    🗑️ Cancelar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
