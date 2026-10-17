import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, ExternalLink, MessageCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

interface Applicant {
  id: string;
  applicantId: string;
  jobId: string;
  message?: string | null;
  status: 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';
  createdAt: string;
  applicant?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    companyName?: string | null;
    bio?: string | null;
    experienceYears?: number | null;
    skills?: string[];
    portfolioUrl?: string | null;
  };
}

const statusBadge: Record<string, string> = {
  PENDIENTE: 'badge-yellow',
  ACEPTADA: 'badge-green',
  RECHAZADA: 'badge-red',
};

export default function ManageApplicantsPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: job } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      const res = await api.get(`/jobs/${id}`);
      return res.data.data || res.data.job;
    },
    enabled: !!id,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['jobApplications', id],
    queryFn: async (): Promise<Applicant[]> => {
      const res = await api.get(`/jobs/${id}/applications`);
      return res.data.data || [];
    },
    enabled: !!id,
  });

  const applicants = data || [];

  const acceptMutation = useMutation({
    mutationFn: (applicationId: string) =>
      api.patch(`/applications/${applicationId}/accept`),
    onSuccess: () => {
      toast.success('Postulación aceptada');
      queryClient.invalidateQueries({ queryKey: ['jobApplications', id] });
      queryClient.invalidateQueries({ queryKey: ['job', id] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Error');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (applicationId: string) =>
      api.patch(`/applications/${applicationId}/reject`),
    onSuccess: () => {
      toast.success('Postulación rechazada');
      queryClient.invalidateQueries({ queryKey: ['jobApplications', id] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Error');
    },
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const pendingCount = applicants.filter((a) => a.status === 'PENDIENTE').length;
  const acceptedCount = applicants.filter((a) => a.status === 'ACEPTADA').length;

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/mis-publicaciones"
          className="mb-4 inline-flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-ink"
        >
          ← Volver a mis publicaciones
        </Link>
        <h1 className="text-2xl font-semibold text-ink">
          Postulantes: {job?.title || 'Trabajo'}
        </h1>
        <div className="mt-2 flex flex-wrap gap-3">
          <span className="badge-yellow">{pendingCount} pendientes</span>
          <span className="badge-green">{acceptedCount} aceptados</span>
          <span className="badge-blue">{applicants.length} total</span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-line rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-line rounded w-1/3" />
                  <div className="h-4 bg-line rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : applicants.length === 0 ? (
        <div className="card text-center py-16">
          <h3 className="text-lg font-semibold text-ink mb-2">Aún no hay postulantes</h3>
          <p className="text-ink-soft max-w-md mx-auto mb-6">
            Espera a que profesionales interesados se postulen a tu trabajo.
          </p>
          <Link to={`/trabajos/${id}`} className="btn-secondary">
            Ver publicación
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applicants.map((app) => (
            <div key={app.id} className="card">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex items-start gap-4 flex-1">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary-500 text-xl font-semibold text-white">
                    {app.applicant?.fullName?.charAt(0).toUpperCase() || 'U'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold text-ink">
                        {app.applicant?.fullName || 'Postulante'}
                      </h3>
                      <span className={`badge ${statusBadge[app.status]}`}>
                        {app.status}
                      </span>
                      <span className="text-xs text-muted">
                        Postulado el {formatDate(app.createdAt)}
                      </span>
                    </div>

                    <div className="mb-3 grid grid-cols-1 gap-2 text-sm text-ink-soft sm:grid-cols-2">
                      {app.applicant?.email && (
                        <div className="flex items-baseline gap-2">
                          <span className="text-[11px] font-medium uppercase text-muted">Email</span>
                          <a href={`mailto:${app.applicant.email}`} className="truncate hover:text-primary-500">
                            {app.applicant.email}
                          </a>
                        </div>
                      )}
                      {app.applicant?.phone && (
                        <div className="flex items-baseline gap-2">
                          <span className="text-[11px] font-medium uppercase text-muted">Teléfono</span>
                          <span>{app.applicant.phone}</span>
                        </div>
                      )}
                      {app.applicant?.companyName && (
                        <div className="flex items-baseline gap-2">
                          <span className="text-[11px] font-medium uppercase text-muted">Empresa</span>
                          <span>{app.applicant.companyName}</span>
                        </div>
                      )}
                      {app.applicant?.experienceYears != null && (
                        <div className="flex items-baseline gap-2">
                          <span className="text-[11px] font-medium uppercase text-muted">Experiencia</span>
                          <span>{app.applicant.experienceYears} años</span>
                        </div>
                      )}
                    </div>

                    {app.applicant?.skills && app.applicant.skills.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-1.5">
                        {app.applicant.skills.map((skill, i) => (
                          <span key={i} className="badge-blue">{skill}</span>
                        ))}
                      </div>
                    )}

                    {app.message && (
                      <div className="mt-3 rounded-lg border border-line bg-subtle p-4">
                        <p className="mb-1 text-xs font-medium text-muted">Mensaje del postulante:</p>
                        <p className="whitespace-pre-wrap text-sm text-ink-soft">{app.message}</p>
                      </div>
                    )}

                    {app.applicant?.bio && (
                      <div className="mt-3 text-sm text-ink-soft">
                        <p className="mb-1 text-xs font-medium text-muted">Bio:</p>
                        <p className="line-clamp-3">{app.applicant.bio}</p>
                      </div>
                    )}

                    {app.applicant?.portfolioUrl && (
                      <div className="mt-2">
                        <a
                          href={app.applicant.portfolioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                          Ver portfolio
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2 lg:w-40">
                  <Link to={`/mensajes/${app.id}`} className="btn-primary text-center">
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    Abrir chat
                  </Link>
                  <button
                    onClick={() => acceptMutation.mutate(app.id)}
                    disabled={app.status !== 'PENDIENTE' || job?.status !== 'ABIERTO' || acceptMutation.isPending}
                    className="btn-success flex-1 lg:flex-none"
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                    {app.status === 'ACEPTADA' ? 'Elegido' : job?.status !== 'ABIERTO' ? 'Trabajo asignado' : 'Aceptar'}
                  </button>
                  <button
                    onClick={() => rejectMutation.mutate(app.id)}
                    disabled={app.status !== 'PENDIENTE' || rejectMutation.isPending}
                    className="btn-danger flex-1 lg:flex-none"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    Rechazar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
