import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  ArrowUpDown,
  CalendarDays,
  Loader2,
  MapPin,
  MessageSquare,
  Rss,
  Search,
  Tag,
  Wallet,
} from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';

interface Job {
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
  publisher?: { id: string; fullName: string; companyName?: string | null };
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const PAGE_SIZE = 8;

/** Fecha límite legible (día-mes corto-año). */
const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });

/** "hace un momento", "hace 3 h", "hace 2 días"... */
const timeAgo = (date: string) => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (Number.isNaN(seconds)) return '';
  if (seconds < 60) return 'hace un momento';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days} d`;
  return formatDate(date);
};

export default function FeedPage() {
  const { user } = useAuthStore();
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      const res = await api.get('/categories');
      return res.data.data || [];
    },
  });

  const filters: Record<string, any> = { status: 'ABIERTO', sortBy };
  if (category) filters.category = category;
  if (search) filters.search = search;

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['feed', { category, sortBy, search }],
      queryFn: async ({ pageParam }) => {
        const res = await api.get('/jobs', {
          params: { ...filters, page: pageParam, limit: PAGE_SIZE },
        });
        return res.data;
      },
      initialPageParam: 1,
      getNextPageParam: (last: any) =>
        last?.page && last?.totalPages && last.page < last.totalPages ? last.page + 1 : undefined,
    });

  const jobs: Job[] = data?.pages.flatMap((p: any) => p?.data || []) ?? [];
  const total = data?.pages[0]?.total ?? jobs.length;

  const applySearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase text-muted">
          <Rss className="h-3.5 w-3.5" aria-hidden="true" />
          Novedades
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">Feed de trabajos</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Ofertas y demandas publicadas por la comunidad, lo más reciente primero.
        </p>
      </div>

      {/* Buscador + orden */}
      <form onSubmit={applySearch} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="feed-search" className="label flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5" aria-hidden="true" />
            Buscar en el feed
          </label>
          <input
            id="feed-search"
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="input"
            placeholder="Ej: Diseño de logo, React, plomería..."
          />
        </div>
        <div className="sm:w-64">
          <label htmlFor="feed-sort" className="label flex items-center gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
            Ordenar por
          </label>
          <select
            id="feed-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input"
          >
            <option value="createdAt">Más recientes</option>
            <option value="budgetDesc">Presupuesto: mayor a menor</option>
            <option value="budgetAsc">Presupuesto: menor a mayor</option>
            <option value="deadlineDate">Fecha límite cercana</option>
          </select>
        </div>
        <button type="submit" className="btn-primary sm:w-32">
          Buscar
        </button>
      </form>

      {/* Filtros rápidos por categoría */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <button
          type="button"
          onClick={() => setCategory('')}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
            category === ''
              ? 'border-primary-500 bg-primary-500 text-white'
              : 'border-line bg-card text-ink-soft hover:border-line-strong hover:text-ink'
          }`}
        >
          Todas
        </button>
        {categories?.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory((prev) => (prev === c.id ? '' : c.id))}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              category === c.id
                ? 'border-primary-500 bg-primary-500 text-white'
                : 'border-line bg-card text-ink-soft hover:border-line-strong hover:text-ink'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <p className="text-sm text-ink-soft">
        {isLoading ? 'Cargando...' : `${total} publicaci${total !== 1 ? 'ones' : 'ón'}`}
      </p>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="mb-4 h-5 w-40 rounded bg-subtle" />
              <div className="mb-2 h-6 w-3/4 rounded bg-subtle" />
              <div className="mb-4 h-4 w-2/3 rounded bg-subtle" />
              <div className="h-10 rounded bg-subtle" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-line bg-card px-6 py-10 text-center">
          <h3 className="text-lg font-semibold text-ink">No pudimos cargar el feed</h3>
          <p className="mt-2 text-sm text-ink-soft">Intenta recargar la página en unos segundos.</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-lg border border-line bg-card px-6 py-10 text-center">
          <h3 className="text-lg font-semibold text-ink">Todavía no hay publicaciones</h3>
          <p className="mt-2 text-sm text-ink-soft">
            Prueba con otra categoría o sé el primero en{' '}
            <Link to="/trabajos/publicar" className="text-link hover:underline">
              publicar un trabajo
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => {
            const isOwner = user?.id === job.publisherId;
            const initial = job.publisher?.fullName?.charAt(0).toUpperCase() || 'U';
            return (
              <article key={job.id} className="card">
                <header className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-500 text-sm font-semibold text-white">
                    {initial}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {job.publisher?.companyName || job.publisher?.fullName || 'Publicante'}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {job.publisher?.companyName ? `${job.publisher.fullName} · ` : ''}
                      {timeAgo(job.createdAt)}
                    </p>
                  </div>
                  <span className="badge-blue shrink-0">{job.category?.name || 'Trabajo'}</span>
                </header>

                <h2 className="mt-4 text-lg font-semibold text-ink">
                  <Link to={`/trabajos/${job.id}`} className="hover:text-link">
                    {job.title}
                  </Link>
                </h2>

                <p className="mt-2 line-clamp-3 text-sm leading-6 text-ink-soft">{job.description}</p>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted">
                  <span className="flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    ${job.budgetMin.toLocaleString('es')}–${job.budgetMax.toLocaleString('es')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {job.locationAddress}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    Fecha límite {formatDate(job.deadlineDate)}
                  </span>
                </div>

                <div className="mt-5 flex flex-col gap-2 border-t border-line pt-4 sm:flex-row">
                  {isOwner ? (
                    <Link
                      to={`/mis-publicaciones/${job.id}/postulantes`}
                      className="btn-secondary sm:w-48"
                    >
                      Ver postulantes
                    </Link>
                  ) : (
                    <>
                      <Link to={`/trabajos/${job.id}`} className="btn-primary sm:w-40">
                        Ver detalle
                      </Link>
                      <Link to={`/usuarios/${job.publisherId}`} className="btn-secondary sm:w-40">
                        <MessageSquare className="h-4 w-4" aria-hidden="true" />
                        Contactar
                      </Link>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="btn-secondary"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Cargando...
              </>
            ) : (
              'Cargar más'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
