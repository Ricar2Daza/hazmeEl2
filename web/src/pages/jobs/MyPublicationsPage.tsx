import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, PlusCircle, Users, X } from 'lucide-react';
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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase text-muted">Trabajos</p>
          <h1 className="mt-2 text-2xl font-semibold text-ink">Mis publicaciones</h1>
          <p className="mt-1 text-sm text-ink-soft">Gestiona los trabajos que has publicado</p>
        </div>
        <Link to="/trabajos/publicar" className="btn-primary whitespace-nowrap">
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          Nuevo trabajo
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-12 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-6 bg-line rounded w-3/4 mb-4" />
              <div className="h-4 bg-line rounded w-1/2 mb-2" />
              <div className="h-4 bg-line rounded w-2/3 mb-4" />
              <div className="flex gap-2">
                <div className="h-10 bg-line rounded flex-1" />
                <div className="h-10 bg-line rounded flex-1" />
              </div>
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="card text-center py-16">
          <h3 className="text-lg font-semibold text-ink">Aún no tienes publicaciones</h3>
          <p className="text-ink-soft mb-6 max-w-md mx-auto">
            Publica tu primer trabajo y empieza a recibir postulaciones de profesionales calificados.
          </p>
          <Link to="/trabajos/publicar" className="btn-primary">
            Publicar primer trabajo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-3 sm:gap-4">
          {jobs.map((job) => {
            const appsCount = job._count?.applications ?? job.applications?.length ?? 0;
            return (
              <div key={job.id} className="card col-span-12 flex flex-col lg:col-span-6">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-soft">{job.category?.name || 'Trabajo'}</p>
                    <h3 className="mt-2 line-clamp-2 text-lg font-semibold text-ink">
                    <Link to={`/trabajos/${job.id}`} className="hover:text-link">
                      {job.title}
                    </Link>
                    </h3>
                  </div>
                  <span className={`badge whitespace-nowrap ${statusBadge[job.status]}`}>
                    {job.status}
                  </span>
                </div>

                <p className="text-sm text-ink-soft line-clamp-2 mb-4">{job.description}</p>

                <div className="mt-4 grid grid-cols-12 gap-x-3 gap-y-2 border-t border-line pt-4 text-[13px] text-muted">
                  <div className="col-span-6">
                    <span>${job.budgetMin} - ${job.budgetMax}</span>
                  </div>
                  <div className="col-span-6">
                    <span>{formatDate(job.deadlineDate)}</span>
                  </div>
                  <div className="col-span-12">
                    {appsCount} postulantes
                  </div>
                </div>

                <div className="mt-auto grid grid-cols-12 gap-2 border-t border-line pt-4">
                  <Link
                    to={`/trabajos/${job.id}/editar`}
                    className="btn-secondary col-span-12 px-2 text-xs lg:col-span-4"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    Editar
                  </Link>
                  <Link
                    to={`/mis-publicaciones/${job.id}/postulantes`}
                    className="btn-primary col-span-12 px-2 text-xs lg:col-span-4"
                  >
                    <Users className="h-3.5 w-3.5" aria-hidden="true" />
                    Postulantes
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm('¿Seguro que deseas cancelar este trabajo?')) {
                        cancelMutation.mutate(job.id);
                      }
                    }}
                    disabled={job.status === 'CANCELADO' || cancelMutation.isPending}
                    className="btn-danger col-span-12 px-2 text-xs lg:col-span-4"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                    Cancelar
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
