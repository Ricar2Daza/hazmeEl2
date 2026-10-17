import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
  locationLat: number;
  locationLng: number;
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
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-6" />
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-6" />
        <div className="h-32 bg-gray-200 rounded" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="card text-center">
        <p className="text-gray-600">Trabajo no encontrado</p>
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
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600"
      >
        ← Volver a resultados
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  {job.category && (
                    <span className="badge-blue">{job.category.name}</span>
                  )}
                  <span className={`badge ${
                    job.status === 'ABIERTO' ? 'badge-green' :
                    job.status === 'EN_PROGRESO' ? 'badge-blue' :
                    job.status === 'FINALIZADO' ? 'badge-gray' : 'badge-red'
                  }`}>
                    {job.status}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary-600">
                  ${job.budgetMin} - ${job.budgetMax}
                </p>
                <p className="text-sm text-gray-500">Presupuesto estimado</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">
                  📍
                </div>
                <div>
                  <p className="text-xs text-gray-500">Ubicación</p>
                  <p className="text-sm font-medium text-gray-900">{job.locationAddress}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-xl">
                  ⏰
                </div>
                <div>
                  <p className="text-xs text-gray-500">Fecha límite</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(job.deadlineDate)}</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Descripción</h2>
              <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {job.description}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Publicado por</h2>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {job.publisher?.fullName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{job.publisher?.fullName || 'Usuario'}</p>
                {job.publisher?.companyName && (
                  <p className="text-sm text-primary-600">{job.publisher.companyName}</p>
                )}
                {job.publisher?.bio && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{job.publisher.bio}</p>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones</h2>

            {isPublisher ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-2">
                  Este trabajo fue publicado por ti.
                </p>
                <button
                  onClick={() => navigate(`/trabajos/${job.id}/editar`)}
                  className="btn-secondary w-full"
                >
                  ✏️ Editar trabajo
                </button>
                <Link
                  to={`/mis-publicaciones/${job.id}/postulantes`}
                  className="btn-primary w-full"
                >
                  👥 Gestionar postulantes
                </Link>
              </div>
            ) : userApplication ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-2">
                  Estado de tu postulación:
                </p>
                <span className={`w-full py-2 text-center block badge text-sm ${
                  userApplication.status === 'PENDIENTE' ? 'badge-yellow' :
                  userApplication.status === 'ACEPTADA' ? 'badge-green' : 'badge-red'
                }`}>
                  {userApplication.status === 'PENDIENTE' ? '⏳ Pendiente' :
                   userApplication.status === 'ACEPTADA' ? '✅ Aceptada' : '❌ Rechazada'}
                </span>
                {userApplication.status === 'ACEPTADA' && (
                  <p className="text-sm text-green-700 bg-green-50 p-3 rounded-lg">
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
                  🚀 Postularme
                </button>
                <p className="text-xs text-gray-500 text-center">
                  Al postularte, el publicante verá tu perfil y mensaje.
                </p>
              </div>
            ) : (
              <div className="text-sm text-gray-600">
                Este trabajo ya no está abierto a postulaciones.
              </div>
            )}
          </div>
        </div>
      </div>

      {applyModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Postularme al trabajo</h3>
                <button
                  onClick={() => setApplyModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
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
                  <p className="text-red-600 text-sm mt-1">{errors.message.message}</p>
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
