import { useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { createJobSchema, CreateJobInput } from '@/lib/schemas/zodSchemas';

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function PublishJobPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id;

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      const res = await api.get('/categories');
      return res.data.data || [];
    },
  });

  const { data: existingJob } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await api.get(`/jobs/${id}`);
      return res.data.data || res.data.job;
    },
    enabled: !!id,
  });

  const defaultDeadline = new Date();
  defaultDeadline.setDate(defaultDeadline.getDate() + 14);
  const deadlineStr = defaultDeadline.toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<CreateJobInput>({
    resolver: zodResolver(createJobSchema),
    defaultValues: {
      title: '',
      description: '',
      categoryId: '',
      budgetMin: 0,
      budgetMax: 0,
      deadlineDate: new Date(deadlineStr),
      locationAddress: '',
      locationLat: -34.6037,
      locationLng: -58.3816,
    },
  });

  useEffect(() => {
    if (existingJob) {
      reset({
        title: existingJob.title,
        description: existingJob.description,
        categoryId: existingJob.categoryId,
        budgetMin: existingJob.budgetMin,
        budgetMax: existingJob.budgetMax,
        deadlineDate: new Date(existingJob.deadlineDate),
        locationAddress: existingJob.locationAddress,
        locationLat: existingJob.locationLat,
        locationLng: existingJob.locationLng,
      });
    }
  }, [existingJob, reset]);

  const budgetMinWatch = watch('budgetMin');

  const createMutation = useMutation({
    mutationFn: (data: CreateJobInput) => {
      if (isEditing) {
        return api.put(`/jobs/${id}`, data);
      }
      return api.post('/jobs', data);
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Trabajo actualizado' : 'Trabajo publicado exitosamente');
      navigate('/mis-publicaciones');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Error al guardar el trabajo');
    },
  });

  const onSubmit = (data: CreateJobInput) => {
    createMutation.mutate(data);
  };

  const deadlineValue = watch('deadlineDate');

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <Link
          to={isEditing ? '/mis-publicaciones' : '/trabajos/buscar'}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 mb-4"
        >
          ← Volver
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Editar trabajo' : 'Publicar nuevo trabajo'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEditing
            ? 'Actualiza los detalles de tu publicación'
            : 'Describe el trabajo que necesitas y empieza a recibir postulaciones'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
        <div>
          <label className="label">Título *</label>
          <input
            type="text"
            {...register('title')}
            className="input"
            placeholder="Ej: Desarrollador React para landing page"
          />
          {errors.title && (
            <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label className="label">Categoría *</label>
          <select {...register('categoryId')} className="input">
            <option value="">Selecciona una categoría</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="text-red-600 text-sm mt-1">{errors.categoryId.message}</p>
          )}
        </div>

        <div>
          <label className="label">Descripción detallada *</label>
          <textarea
            {...register('description')}
            rows={6}
            className="input resize-none"
            placeholder="Describe el proyecto, objetivos, requisitos, entregables, etc."
          />
          {errors.description && (
            <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Mínimo 20 caracteres. Sé específico para atraer mejores postulantes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Presupuesto mínimo ($) *</label>
            <input
              type="number"
              {...register('budgetMin', { valueAsNumber: true })}
              className="input"
              placeholder="100"
              min="0"
            />
            {errors.budgetMin && (
              <p className="text-red-600 text-sm mt-1">{errors.budgetMin.message}</p>
            )}
          </div>
          <div>
            <label className="label">Presupuesto máximo ($) *</label>
            <input
              type="number"
              {...register('budgetMax', { valueAsNumber: true })}
              className="input"
              placeholder="500"
              min={budgetMinWatch || 0}
            />
            {errors.budgetMax && (
              <p className="text-red-600 text-sm mt-1">{errors.budgetMax.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="label">Fecha límite *</label>
          <input
            type="date"
            {...register('deadlineDate')}
            className="input"
            min={new Date().toISOString().split('T')[0]}
          />
          {errors.deadlineDate && (
            <p className="text-red-600 text-sm mt-1">{errors.deadlineDate.message}</p>
          )}
          {deadlineValue && (
            <p className="text-xs text-gray-500 mt-1">
              Los postulantes verán esta fecha como plazo máximo de entrega estimada.
            </p>
          )}
        </div>

        <div>
          <label className="label">Dirección / Ubicación *</label>
          <input
            type="text"
            {...register('locationAddress')}
            className="input"
            placeholder="Ej: Av. Corrientes 1234, CABA, Buenos Aires"
          />
          {errors.locationAddress && (
            <p className="text-red-600 text-sm mt-1">{errors.locationAddress.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Latitud *</label>
            <input
              type="number"
              step="any"
              {...register('locationLat', { valueAsNumber: true })}
              className="input"
              placeholder="-34.6037"
            />
            {errors.locationLat && (
              <p className="text-red-600 text-sm mt-1">{errors.locationLat.message}</p>
            )}
          </div>
          <div>
            <label className="label">Longitud *</label>
            <input
              type="number"
              step="any"
              {...register('locationLng', { valueAsNumber: true })}
              className="input"
              placeholder="-58.3816"
            />
            {errors.locationLng && (
              <p className="text-red-600 text-sm mt-1">{errors.locationLng.message}</p>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500 -mt-2">
          Valores por defecto Buenos Aires (lat -34.60 / lng -58.38). Ajusta según la ubicación real.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
          <Link
            to={isEditing ? '/mis-publicaciones' : '/trabajos/buscar'}
            className="btn-secondary flex-1"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex-1"
          >
            {isSubmitting
              ? 'Guardando...'
              : isEditing ? 'Guardar cambios' : '📢 Publicar trabajo'}
          </button>
        </div>
      </form>
    </div>
  );
}
