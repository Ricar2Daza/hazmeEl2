import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 mb-4"
        >
          ← Volver a mis publicaciones
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Postulantes: {job?.title || 'Trabajo'}
        </h1>
        <div className="flex flex-wrap gap-3 mt-2">
          <span className="badge-yellow">⏳ {pendingCount} pendientes</span>
          <span className="badge-green">✅ {acceptedCount} aceptados</span>
          <span className="badge-blue">👥 {applicants.length} total</span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : applicants.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-6xl mb-4">👥</p>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Aún no hay postulantes</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
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
                  <div className="w-14 h-14 bg-primary-600 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {app.applicant?.fullName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {app.applicant?.fullName || 'Postulante'}
                      </h3>
                      <span className={`badge ${statusBadge[app.status]}`}>
                        {app.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        Postulado el {formatDate(app.createdAt)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                      {app.applicant?.email && (
                        <div className="flex items-center gap-1.5">
                          <span>📧</span>
                          <a href={`mailto:${app.applicant.email}`} className="hover:text-primary-600 truncate">
                            {app.applicant.email}
                          </a>
                        </div>
                      )}
                      {app.applicant?.phone && (
                        <div className="flex items-center gap-1.5">
                          <span>📱</span>
                          <span>{app.applicant.phone}</span>
                        </div>
                      )}
                      {app.applicant?.companyName && (
                        <div className="flex items-center gap-1.5">
                          <span>🏢</span>
                          <span>{app.applicant.companyName}</span>
                        </div>
                      )}
                      {app.applicant?.experienceYears != null && (
                        <div className="flex items-center gap-1.5">
                          <span>💼</span>
                          <span>{app.applicant.experienceYears} años de experiencia</span>
                        </div>
                      )}
                    </div>

                    {app.applicant?.skills && app.applicant.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {app.applicant.skills.map((skill, i) => (
                          <span key={i} className="badge-blue">{skill}</span>
                        ))}
                      </div>
                    )}

                    {app.message && (
                      <div className="bg-gray-50 rounded-lg p-4 mt-3">
                        <p className="text-xs font-medium text-gray-500 mb-1">Mensaje del postulante:</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{app.message}</p>
                      </div>
                    )}

                    {app.applicant?.bio && (
                      <div className="mt-3 text-sm text-gray-600">
                        <p className="text-xs font-medium text-gray-500 mb-1">Bio:</p>
                        <p className="line-clamp-3">{app.applicant.bio}</p>
                      </div>
                    )}

                    {app.applicant?.portfolioUrl && (
                      <div className="mt-2">
                        <a
                          href={app.applicant.portfolioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary-600 hover:underline inline-flex items-center gap-1"
                        >
                          🔗 Ver portfolio
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex lg:flex-col gap-2 lg:w-40 flex-shrink-0">
                  <button
                    onClick={() => acceptMutation.mutate(app.id)}
                    disabled={app.status !== 'PENDIENTE' || acceptMutation.isPending}
                    className="btn-success flex-1 lg:flex-none"
                  >
                    ✅ Aceptar
                  </button>
                  <button
                    onClick={() => rejectMutation.mutate(app.id)}
                    disabled={app.status !== 'PENDIENTE' || rejectMutation.isPending}
                    className="btn-danger flex-1 lg:flex-none"
                  >
                    ❌ Rechazar
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
