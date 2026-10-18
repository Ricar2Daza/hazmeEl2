import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  Star,
  Users,
  Wallet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { directApi, ratingsApi } from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import RatingStars from '@/components/ui/RatingStars';

interface OpenJob {
  id: string;
  title: string;
  category?: { id: string; name: string };
  budgetMin: number;
  budgetMax: number;
  _count?: { applications: number };
}

interface RatingSummary {
  average: number;
  count: number;
}

interface MyRating {
  id: string;
  score: number;
  comment: string | null;
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
  rating: RatingSummary;
  myRating: MyRating | null;
  openJobs: OpenJob[];
}

interface RatingEntry {
  id: string;
  score: number;
  comment: string | null;
  createdAt: string;
  rater: { id: string; fullName: string; companyName?: string | null };
}

const memberSince = (date: string) =>
  new Date(date).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

const shortDate = (date: string) =>
  new Date(date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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

  const ratingsQuery = useQuery({
    queryKey: ['users', 'ratings', id],
    queryFn: async () => {
      const res = await ratingsApi.list(id!);
      return res.data;
    },
    enabled: !!id,
  });

  const isSelf = currentUserId === data?.id;

  // Estado local del formulario de valoración.
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (data?.myRating) {
      setScore(data.myRating.score);
      setComment(data.myRating.comment || '');
    }
  }, [data?.myRating?.id]);

  const rateMutation = useMutation({
    mutationFn: (payload: { score: number; comment: string }) =>
      ratingsApi.upsert(id!, payload.score, payload.comment),
    onSuccess: () => {
      toast.success('Valoración guardada');
      queryClient.invalidateQueries({ queryKey: ['users', 'profile', id] });
      queryClient.invalidateQueries({ queryKey: ['users', 'ratings', id] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'No se pudo guardar la valoración');
    },
  });

  const startChatMutation = useMutation({
    mutationFn: () => directApi.start(id!),
    onSuccess: (res) => {
      const conversationId = res.data?.data?.id;
      if (conversationId) navigate(`/mensajes/directos/${conversationId}`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'No se pudo iniciar la conversación');
    },
  });

  const handleRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (score < 1 || score > 5) {
      toast.error('Selecciona una puntuación de 1 a 5 estrellas');
      return;
    }
    rateMutation.mutate({ score, comment });
  };

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

  const firstJob = data.openJobs?.[0];
  const reviews: RatingEntry[] = ratingsQuery.data?.data || [];

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

            {/* Valoración media */}
            <div className="mt-1 flex items-center gap-2">
              <RatingStars value={data.rating?.average || 0} size="sm" count={data.rating?.count || 0} />
              {data.rating?.count === 0 && (
                <span className="text-xs text-muted">Sin valoraciones todavía</span>
              )}
            </div>

            {data.companyName && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-soft">
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
              <span className="text-ink-soft">
                <Users className="mr-1 inline h-3.5 w-3.5 align-[-2px]" aria-hidden="true" />
                <strong className="text-ink">{data.rating?.count ?? 0}</strong> valoracion
                {(data.rating?.count ?? 0) !== 1 ? 'es' : ''}
              </span>
            </div>
          </div>

          {/* Acciones */}
          {!isSelf && (
            <div className="flex shrink-0 flex-col gap-2">
              <button
                type="button"
                onClick={() => startChatMutation.mutate()}
                disabled={startChatMutation.isPending}
                className="btn-primary w-full sm:w-auto"
              >
                {startChatMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <MessageSquare className="h-4 w-4" aria-hidden="true" />
                )}
                Enviar mensaje
              </button>
              {firstJob && (
                <Link to={`/trabajos/${firstJob.id}`} className="btn-secondary w-full sm:w-auto">
                  Ver sus trabajos
                </Link>
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

      {/* Valorar a este usuario */}
      {!isSelf && (
        <div className="card">
          <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-ink">
            <Star className="h-5 w-5 text-accent-500" aria-hidden="true" />
            {data.myRating ? 'Tu valoración' : 'Valorar a esta persona'}
          </h2>
          <p className="mb-4 text-sm text-muted">
            Puedes valorar una sola vez. Al enviarla se actualiza tu puntuación anterior.
          </p>

          <form onSubmit={handleRate} className="space-y-4">
            <div>
              <span className="label mb-1 block">Puntuación</span>
              <RatingStars value={score} onChange={setScore} size="md" />
            </div>

            <div>
              <label htmlFor="rating-comment" className="label block">
                Comentario (opcional)
              </label>
              <textarea
                id="rating-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="Cuéntanos cómo fue tu experiencia..."
                className="input resize-y"
              />
            </div>

            <button
              type="submit"
              disabled={score < 1 || rateMutation.isPending}
              className="btn-primary"
            >
              {rateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Guardando...
                </>
              ) : data.myRating ? (
                'Actualizar valoración'
              ) : (
                'Enviar valoración'
              )}
            </button>
          </form>
        </div>
      )}

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

      {/* Reseñas / valoraciones recibidas */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-ink">
          <Star className="h-5 w-5 text-muted" aria-hidden="true" />
          Valoraciones ({data.rating?.count ?? 0})
        </h2>

        {ratingsQuery.isLoading ? (
          <p className="text-sm text-muted">Cargando valoraciones...</p>
        ) : reviews.length === 0 ? (
          <div className="rounded-lg border border-line bg-card px-6 py-8 text-center text-sm text-ink-soft">
            Esta persona todavía no tiene valoraciones.
          </div>
        ) : (
          <ul className="space-y-3">
            {reviews.map((review) => (
              <li key={review.id} className="card">
                <div className="flex items-center justify-between gap-3">
                  <Link
                    to={`/usuarios/${review.rater.id}`}
                    className="flex min-w-0 items-center gap-3 hover:text-link"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-500 text-sm font-semibold text-white">
                      {review.rater.fullName.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {review.rater.fullName}
                      </span>
                      {review.rater.companyName && (
                        <span className="block truncate text-xs text-muted">{review.rater.companyName}</span>
                      )}
                    </span>
                  </Link>
                  <div className="shrink-0 text-right">
                    <RatingStars value={review.score} size="sm" />
                    <time className="mt-1 block text-[11px] text-muted">{shortDate(review.createdAt)}</time>
                  </div>
                </div>
                {review.comment && (
                  <p className="mt-3 border-t border-line pt-3 text-sm leading-6 text-ink-soft">
                    {review.comment}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
