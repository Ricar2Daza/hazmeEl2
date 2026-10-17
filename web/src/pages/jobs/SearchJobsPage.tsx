import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpDown, CalendarDays, MapPin, Search, Tag, Wallet } from 'lucide-react';
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
  publisher?: { id: string; fullName: string; companyName?: string };
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function SearchJobsPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [deadlineFrom, setDeadlineFrom] = useState('');
  const [deadlineTo, setDeadlineTo] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [page, setPage] = useState(1);
  const limit = 9;

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      const res = await api.get('/categories');
      return res.data.data || [];
    },
  });

  const params: Record<string, any> = {
    page,
    limit,
    sortBy,
  };
  if (search) params.search = search;
  if (category) params.category = category;
  if (budgetMin) params.budgetMin = budgetMin;
  if (budgetMax) params.budgetMax = budgetMax;
  if (deadlineFrom) params.deadlineFrom = deadlineFrom;
  if (deadlineTo) params.deadlineTo = deadlineTo;
  params.status = 'ABIERTO';

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', 'list', params],
    queryFn: async () => {
      const res = await api.get('/jobs', { params });
      return res.data;
    },
  });

  const jobs: Job[] = data?.data || data?.jobs || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || jobs.length;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase text-muted">Oportunidades</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">Buscar trabajos</h1>
        <p className="mt-1 text-sm text-ink-soft">Proyectos publicados por otros usuarios</p>
      </div>

      <div className="border-y border-line py-4">
        <div className="jobs-filter-grid grid grid-cols-12 gap-3 sm:gap-4">
          <div className="sm:col-span-2 xl:col-span-1">
            <label className="label flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5" aria-hidden="true" />
              Buscar
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input"
              placeholder="Ej: Desarrollador React"
            />
          </div>

          <div>
            <label className="label flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" aria-hidden="true" />
              Categoría
            </label>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="input"
            >
              <option value="">Todas las categorías</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label flex items-center gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
              Ordenar por
            </label>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="input"
            >
              <option value="createdAt">Más recientes</option>
              <option value="budgetDesc">Presupuesto: mayor a menor</option>
              <option value="budgetAsc">Presupuesto: menor a mayor</option>
              <option value="deadlineDate">Fecha límite cercana</option>
            </select>
          </div>

          <div>
            <label className="label flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
              Presupuesto min ($)
            </label>
            <input
              type="number"
              value={budgetMin}
              onChange={(e) => { setBudgetMin(e.target.value); setPage(1); }}
              className="input"
              placeholder="Ej: 100"
              min="0"
            />
          </div>

          <div>
            <label className="label flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
              Presupuesto max ($)
            </label>
            <input
              type="number"
              value={budgetMax}
              onChange={(e) => { setBudgetMax(e.target.value); setPage(1); }}
              className="input"
              placeholder="Ej: 1000"
              min="0"
            />
          </div>

          <div>
            <label className="label flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              Fecha límite desde
            </label>
            <input
              type="date"
              value={deadlineFrom}
              onChange={(e) => { setDeadlineFrom(e.target.value); setPage(1); }}
              className="input"
            />
          </div>

          <div>
            <label className="label flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              Fecha límite hasta
            </label>
            <input
              type="date"
              value={deadlineTo}
              onChange={(e) => { setDeadlineTo(e.target.value); setPage(1); }}
              className="input"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-soft">
          {isLoading ? 'Cargando...' : `${total} trabajo${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-12 gap-3 sm:gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card col-span-12 animate-pulse sm:col-span-6 xl:col-span-4">
              <div className="mb-4 h-6 w-3/4 rounded bg-subtle" />
              <div className="mb-2 h-4 w-1/2 rounded bg-subtle" />
              <div className="mb-4 h-4 w-2/3 rounded bg-subtle" />
              <div className="h-10 rounded bg-subtle" />
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="col-span-12 rounded-lg border border-line bg-card px-6 py-10 text-center">
          <h3 className="text-lg font-semibold text-ink">No se encontraron trabajos</h3>
          <p className="mt-2 text-sm text-ink-soft">Prueba ajustando los filtros de búsqueda</p>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-3 sm:gap-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="col-span-12 flex flex-col rounded-lg border border-line bg-card p-6 sm:col-span-6 xl:col-span-4"
            >
              <div className="min-h-20">
                <p className="text-sm font-medium text-ink-soft">
                  {job.publisher?.companyName || job.publisher?.fullName || 'Publicante'}
                </p>
                <h3 className="mt-2 line-clamp-2 text-lg font-semibold text-ink">
                  {job.title}
                </h3>
              </div>

              <p className="mb-4 mt-3 line-clamp-2 text-sm leading-5 text-ink-soft">{job.description}</p>

              <div className="mb-5 mt-auto space-y-2 border-t border-line pt-4 text-[13px] text-muted">
                <p className="flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {job.category?.name || 'Trabajo'}
                </p>
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {job.locationAddress}
                </p>
                <p className="flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  ${job.budgetMin.toLocaleString('es')}–${job.budgetMax.toLocaleString('es')}
                </p>
                <p className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  Fecha límite {formatDate(job.deadlineDate)}
                </p>
              </div>

              <div className="mt-auto border-t border-line pt-4">
                {user && user.id === job.publisherId ? (
                  <Link to={`/mis-publicaciones/${job.id}/postulantes`} className="btn-secondary w-full">
                    Ver postulantes
                  </Link>
                ) : (
                  <Link to={`/trabajos/${job.id}`} className="btn-primary w-full">
                    Ver detalle
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary"
          >
            ← Anterior
          </button>
          <span className="px-4 text-sm text-ink-soft">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn-secondary"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
