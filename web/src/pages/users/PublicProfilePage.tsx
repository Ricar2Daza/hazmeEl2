import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Award,
  Briefcase,
  Building2,
  CalendarDays,
  Globe,
  Loader2,
  MapPin,
  MessageSquare,
  Wallet,
} from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';

interface OpenJob {
  id: string;
  title: string;
  category?: { id: string; name: string };
  budgetMin: number;
  budgetMax: number;
  _count?: { applications: number };
}

interface PublicProfile {
  id: string;
  fullName: string;
  companyName?: string | null;
  bio?: string | null;
  experienceYears?: number | null;
  skills?: string[];
  locationAddress?: string | null;
  portfolioUrl?: string | null;
  createdAt: string;
  _count?: { publishedJobs: number; myApplications: number };
  openJobs: OpenJob[];
}

const memberSince = (date: string) =>
  new Date(date).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['users', 'profile', id],
    queryFn: async (): Promise<PublicProfile> => {
      const res = await api.get(`/users/${id}`);
      return res.data.data;
    },
    enabled: !!id,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="grid min-h-[50vh] place-items-center text-muted">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <Link to="/usuarios" className="inline-flex items-center gap-1.5 text-sm text-link hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a la búsqueda
        </Link>
        <div className="rounded-lg border border-line bg-card px-6 py-10 text-center">
          <h1 className="text-lg font-semibold text-ink">No encontramos este perfil</h1>
          <p className="mt-2 text-sm text-ink-soft">El usuario no existe o ya no está disponible.</p>
        </div>
      </div>
    );
  }

  const isSelf = currentUserId === data.id;
  const firstJob = data.openJobs?.[0];

  return (
    <div className="space-y-6">
      <Link to="/usuarios" className="inline-flex items-center gap-1.5 text-sm text-link hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a la búsqueda
      </Link>

      {/* Cabecera del perfil */}
      <div className="card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-primary-500 text-2xl font-semibold text-white">
            {data.fullName?.charAt(0).toUpperCase() || 'U'}
          </span>

          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold text-ink">{data.fullName}</h1>
            {data.companyName && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
                <Building2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                {data.companyName}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted">
              {data.locationAddress && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {data.locationAddress}
                </span>
              )}
              {typeof data.experienceYears === 'number' && (
                <span className="flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {data.experienceYears} año{data.experienceYears !== 1 ? 's' : ''} de experiencia
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Miembro desde {memberSince(data.createdAt)}
              </span>
              {data.portfolioUrl && (
                <a
                  href={data.portfolioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-link hover:underline"
                >
                  <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  Portafolio
                </a>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-4 border-t border-line pt-4 text-sm">
              <span className="text-ink-soft">
                <strong className="text-ink">{data._count?.publishedJobs ?? 0}</strong> publicacion
                {(data._count?.publishedJobs ?? 0) !== 1 ? 'es' : ''}
              </span>
              <span className="text-ink-soft">
                <strong className="text-ink">{data._count?.myApplications ?? 0}</strong> postulacion
                {(data._count?.myApplications ?? 0) !== 1 ? 'es' : ''}
              </span>
            </div>
          </div>

          {!isSelf && (
            <div className="shrink-0">
              {firstJob ? (
                <Link to={`/trabajos/${firstJob.id}`} className="btn-primary w-full sm:w-auto">
                  <MessageSquare className="h-4 w-4" aria-hidden="true" />
                  Contactar
                </Link>
              ) : (
                <button type="button" className="btn-secondary w-full sm:w-auto" disabled>
                  Sin contacto disponible
                </button>
              )}
            </div>
          )}
        </div>

        {data.bio && <p className="mt-5 border-t border-line pt-5 text-sm leading-6 text-ink-soft">{data.bio}</p>}

        {data.skills && data.skills.length > 0 && (
          <div className="mt-5">
            <h2 className="mb-2 text-sm font-semibold text-ink">Habilidades</h2>
            <div className="flex flex-wrap gap-1.5">
              {data.skills.map((skill) => (
                <span key={skill} className="badge-blue">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Trabajos abiertos */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-ink">
          <Briefcase className="h-5 w-5 text-muted" aria-hidden="true" />
          Trabajos abiertos
        </h2>

        {data.openJobs.length === 0 ? (
          <div className="rounded-lg border border-line bg-card px-6 py-8 text-center text-sm text-ink-soft">
            Esta persona no tiene publicaciones abiertas en este momento.
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-3 sm:gap-4">
            {data.openJobs.map((job) => (
              <Link
                key={job.id}
                to={`/trabajos/${job.id}`}
                className="card col-span-12 flex flex-col transition-colors hover:border-line-strong sm:col-span-6"
              >
                <span className="badge-blue w-fit">{job.category?.name || 'Trabajo'}</span>
                <h3 className="mt-3 line-clamp-2 text-base font-semibold text-ink">{job.title}</h3>
                <div className="mt-auto flex items-center gap-4 border-t border-line pt-4 text-[13px] text-muted">
                  <span className="flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    ${job.budgetMin.toLocaleString('es')}–${job.budgetMax.toLocaleString('es')}
                  </span>
                  <span>{job._count?.applications ?? 0} postulantes</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
