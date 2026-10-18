import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Briefcase, Building2, Loader2, MapPin, Search, Users } from 'lucide-react';
import api from '@/lib/axios';

interface PublicUser {
  id: string;
  fullName: string;
  companyName?: string | null;
  bio?: string | null;
  experienceYears?: number | null;
  skills?: string[];
  locationAddress?: string | null;
  _count?: { publishedJobs: number };
}

export default function UserSearchPage() {
  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');

  // Debounce simple para no disparar una petición por cada tecla.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(term.trim()), 300);
    return () => clearTimeout(t);
  }, [term]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['users', 'search', debounced],
    queryFn: async () => {
      const res = await api.get('/users', {
        params: { search: debounced || undefined, limit: 24 },
      });
      return res.data;
    },
  });

  const users: PublicUser[] = data?.data || [];
  const total = data?.total ?? users.length;

  return (
    <div className="space-y-6">
      <div>
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase text-muted">
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          Comunidad
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">Buscar personas</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Encuentra profesionales por nombre, empresa o habilidad y contacta con ellos.
        </p>
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <input
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          className="input pl-9"
          placeholder="Ej: Ana, carpintería, React, diseño..."
          aria-label="Buscar personas"
          autoFocus
        />
        {isFetching && (
          <Loader2
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted"
            aria-hidden="true"
          />
        )}
      </div>

      <p className="text-sm text-ink-soft">
        {isLoading ? 'Cargando...' : `${total} persona${total !== 1 ? 's' : ''} encontrada${total !== 1 ? 's' : ''}`}
      </p>

      {isLoading ? (
        <div className="grid grid-cols-12 gap-3 sm:gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card col-span-12 animate-pulse sm:col-span-6 xl:col-span-4">
              <div className="mb-4 h-10 w-10 rounded-full bg-subtle" />
              <div className="mb-2 h-5 w-2/3 rounded bg-subtle" />
              <div className="mb-4 h-4 w-1/2 rounded bg-subtle" />
              <div className="h-10 rounded bg-subtle" />
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-lg border border-line bg-card px-6 py-10 text-center">
          <h3 className="text-lg font-semibold text-ink">Sin resultados</h3>
          <p className="mt-2 text-sm text-ink-soft">
            No encontramos personas con “{debounced}”. Prueba con otro nombre o habilidad.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-3 sm:gap-4">
          {users.map((u) => (
            <Link
              key={u.id}
              to={`/usuarios/${u.id}`}
              className="card col-span-12 flex flex-col transition-colors hover:border-line-strong sm:col-span-6 xl:col-span-4"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-500 text-base font-semibold text-white">
                  {u.fullName?.charAt(0).toUpperCase() || 'U'}
                </span>
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-ink">{u.fullName}</h3>
                  {u.companyName && (
                    <p className="flex items-center gap-1 truncate text-xs text-muted">
                      <Building2 className="h-3 w-3 shrink-0" aria-hidden="true" />
                      {u.companyName}
                    </p>
                  )}
                </div>
              </div>

              <p className="mt-3 line-clamp-2 min-h-10 text-sm text-ink-soft">
                {u.bio || 'Sin descripción todavía.'}
              </p>

              {u.skills && u.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {u.skills.slice(0, 4).map((skill) => (
                    <span key={skill} className="badge-gray">
                      {skill}
                    </span>
                  ))}
                  {u.skills.length > 4 && (
                    <span className="badge-gray">+{u.skills.length - 4}</span>
                  )}
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted">
                {u.locationAddress && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {u.locationAddress}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {u._count?.publishedJobs ?? 0} publicación{(u._count?.publishedJobs ?? 0) !== 1 ? 'es' : ''}
                </span>
              </div>

              <span className="mt-4 flex items-center gap-1 border-t border-line pt-4 text-sm font-medium text-link">
                Ver perfil
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
