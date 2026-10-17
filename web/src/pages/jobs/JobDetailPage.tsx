import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, CalendarDays, MapPin, Send, Users, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { applyMessageSchema, ApplyMessageInput } from '@/lib/schemas/zodSchemas';

interface JobDetail {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  category?: { id: string; name: string };
  budgetMin: number;
  budgetMax: number;
  deadlineDate: string;
  locationAddress: string;
  status: string;
  publisherId: string;
  publisher?: {
    id: string;
    fullName: string;
    email?: string;
    companyName?: string | null;
    phone?: string | null;
    bio?: string | null;
  };
  applications?: Array<{
    id: string;
    applicantId: string;
    status: string;
    createdAt?: string;
  }>;
  createdAt: string;
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [applyModalOpen, setApplyModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: async (): Promise<JobDetail> => {
      const res = await api.get(`/jobs/${id}`);
      return res.data.data || res.data.job;
    },
    enabled: !!id,
  });

  const job = data;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ApplyMessageInput>({
    resolver: zodResolver(applyMessageSchema),
  });

  const applyMutation = useMutation({
    mutationFn: (data: ApplyMessageInput) =>
      api.post(`/jobs/${id}/apply`, { message: data.message || null }),
    onSuccess: () => {
      toast.success('Postulación enviada exitosamente');
      setApplyModalOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Error al enviar postulación');
    },
  });

  const onSubmitApply = (data: ApplyMessageInput) => {
    applyMutation.mutate(data);
  };

  const isPublisher = user && job && user.id === job.publisherId;
  const userApplication = job?.applications?.find((a) => a.applicantId === user?.id);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="h-8 bg-line rounded w-3/4 mb-6" />
        <div className="h-4 bg-line rounded w-1/2 mb-2" />
        <div className="h-4 bg-line rounded w-2/3 mb-6" />
        <div className="h-32 bg-line rounded" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="card text-center">
        <p className="text-ink-soft">Trabajo no encontrado</p>
        <Link to="/trabajos/buscar" className="btn-primary mt-4">
          Volver a buscar
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/trabajos/buscar"
        className="inline-flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a resultados
      </Link>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 space-y-4 lg:col-span-8">
          <div className="card">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  {job.category && (
                    <span className="badge-blue">{job.category.name}</span>
                  )}
                  <span className="badge">
                    {job.status}
                  </span>
                </div>
                <h1 className="text-lg font-semibold text-ink">{job.title}</h1>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-ink">
                  <Wallet className="mr-1 inline h-4 w-4 text-accent-500" aria-hidden="true" />
                  ${job.budgetMin} - ${job.budgetMax}
                </p>
                <p className="text-sm text-muted">Presupuesto estimado</p>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-3 border-b border-line pb-5 sm:gap-4">
              <div className="col-span-12 sm:col-span-6">
                <div>
                  <p className="flex items-center gap-1.5 text-[13px] text-muted">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    Ubicación
                  </p>
                  <p className="mt-1 text-sm font-medium text-ink-mid">{job.locationAddress}</p>
                </div>
              </div>
              <div className="col-span-12 sm:col-span-6">
                <div>
                  <p className="flex items-center gap-1.5 text-[13px] text-muted">
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                    Fecha límite
                  </p>
                  <p className="mt-1 text-sm font-medium text-ink-mid">{formatDate(job.deadlineDate)}</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-ink">Descripción</h2>
              <div className="whitespace-pre-wrap leading-relaxed text-ink-soft">
                {job.description}
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 space-y-4 lg:col-span-4">
          <div className="card">
            <h2 className="mb-4 text-lg font-semibold text-ink">Publicado por</h2>
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary-500 text-xl font-semibold text-white">
                {job.publisher?.fullName?.charAt(0).toUpperCase() || 'U'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{job.publisher?.fullName || 'Usuario'}</p>
                {(job.publisher?.companyName || job.publisher?.fullName) && (
                  <p className="text-sm font-medium text-ink-soft">{job.publisher.companyName || job.publisher.fullName}</p>
                )}
                {job.publisher?.bio && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{job.publisher.bio}</p>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="mb-4 text-lg font-semibold text-ink">Acciones</h2>

            {isPublisher ? (
              <div className="space-y-3">
                <p className="mb-2 text-sm text-ink-soft">
                  Este trabajo fue publicado por ti.
                </p>
                <button
                  onClick={() => navigate(`/trabajos/${job.id}/editar`)}
                  className="btn-secondary w-full"
                >
                  Editar trabajo
                </button>
                <Link
                  to={`/mis-publicaciones/${job.id}/postulantes`}
                  className="btn-primary w-full"
                >
                  <Users className="h-4 w-4" aria-hidden="true" />
                  Gestionar postulantes
                </Link>
              </div>
            ) : userApplication ? (
              <div className="space-y-3">
                <p className="mb-2 text-sm text-ink-soft">
                  Estado de tu postulación:
                </p>
                <p
                  className={`rounded-lg border px-3 py-2 text-center text-sm font-medium ${
                    userApplication.status === 'ACEPTADA'
                      ? 'border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400'
                      : userApplication.status === 'RECHAZADA'
                        ? 'border-red-300 text-red-700 dark:border-red-800 dark:text-red-400'
                        : 'border-line-strong text-ink-soft'
                  }`}
                >
                  {userApplication.status === 'PENDIENTE' ? 'Pendiente' :
                   userApplication.status === 'ACEPTADA' ? 'Aceptada' : 'Rechazada'}
                </p>
                {userApplication.status === 'ACEPTADA' && (
                  <p className="rounded-lg border border-line p-3 text-sm text-ink-soft">
                    ¡Felicidades! El publicante aceptó tu postulación. Pronto te contactarán.
                  </p>
                )}
              </div>
            ) : job.status === 'ABIERTO' ? (
              <div className="space-y-3">
                <button
                  onClick={() => setApplyModalOpen(true)}
                  className="btn-primary w-full"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Postularme
                </button>
                <p className="text-center text-xs text-muted">
                  Al postularte, el publicante verá tu perfil y mensaje.
                </p>
              </div>
            ) : (
              <div className="text-sm text-ink-soft">
                Este trabajo ya no está abierto a postulaciones.
              </div>
            )}
          </div>
        </div>
      </div>

      {applyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-line bg-card">
            <div className="border-b border-line p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-ink">Postularme al trabajo</h3>
                <button
                  onClick={() => setApplyModalOpen(false)}
                  aria-label="Cerrar"
                  className="rounded-lg p-1 text-muted transition-colors hover:bg-subtle hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  ✕
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit(onSubmitApply)} className="p-6 space-y-4">
              <div>
                <label className="label">Mensaje al publicante (opcional)</label>
                <textarea
                  {...register('message')}
                  rows={5}
                  className="input resize-none"
                  placeholder="Cuéntale al publicante por qué eres la persona ideal para este trabajo..."
                />
                {errors.message && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.message.message}</p>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setApplyModalOpen(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex-1"
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar postulación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
