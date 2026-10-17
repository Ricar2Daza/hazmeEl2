import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
  locationLat: number;
  locationLng: number;
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
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [radius, setRadius] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const limit = 9;

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
        },
        () => {
          setLat(-34.6037);
          setLng(-58.3816);
        }
      );
    } else {
      setLat(-34.6037);
      setLng(-58.3816);
    }
  }, []);

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
  if (lat !== null) params.lat = String(lat);
  if (lng !== null) params.lng = String(lng);
  if (radius !== '') params.radius = String(radius);
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Buscar trabajos</h1>
        <p className="text-gray-600 mt-1">Encuentra la oportunidad perfecta para ti</p>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div className="sm:col-span-2 xl:col-span-1">
            <label className="label">Buscar</label>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input"
              placeholder="Ej: Desarrollador React"
            />
          </div>

          <div>
            <label className="label">Categoría</label>
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
            <label className="label">Ordenar por</label>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="input"
            >
              <option value="newest">Más recientes</option>
              <option value="budget-high">Presupuesto: mayor a menor</option>
              <option value="budget-low">Presupuesto: menor a mayor</option>
              <option value="deadline">Fecha límite cercana</option>
            </select>
          </div>

          <div>
            <label className="label">Presupuesto min ($)</label>
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
            <label className="label">Presupuesto max ($)</label>
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
            <label className="label">Radio (km)</label>
            <select
              value={String(radius)}
              onChange={(e) => { setRadius(e.target.value === '' ? '' : Number(e.target.value)); setPage(1); }}
              className="input"
            >
              <option value="">Cualquier distancia</option>
              <option value="5">5 km</option>
              <option value="10">10 km</option>
              <option value="25">25 km</option>
              <option value="50">50 km</option>
              <option value="100">100 km</option>
            </select>
          </div>

          <div>
            <label className="label">Fecha límite desde</label>
            <input
              type="date"
              value={deadlineFrom}
              onChange={(e) => { setDeadlineFrom(e.target.value); setPage(1); }}
              className="input"
            />
          </div>

          <div>
            <label className="label">Fecha límite hasta</label>
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
        <p className="text-sm text-gray-600">
          {isLoading ? 'Cargando...' : `${total} trabajo${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-4" />
              <div className="h-10 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-5xl mb-4">🔍</p>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron trabajos</h3>
          <p className="text-gray-600">Prueba ajustando los filtros de búsqueda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="card flex flex-col hover:-translate-y-1 transition-transform"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1 mr-2">
                  {job.title}
                </h3>
                {job.category && (
                  <span className="badge-blue whitespace-nowrap">
                    {job.category.name}
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                {job.description}
              </p>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <span>💰</span>
                  <span className="font-medium text-gray-900">
                    ${job.budgetMin} - ${job.budgetMax}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📍</span>
                  <span className="line-clamp-1">{job.locationAddress}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>⏰</span>
                  <span>Límite: {formatDate(job.deadlineDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>👤</span>
                  <span>{job.publisher?.fullName || '—'}</span>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-gray-100">
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
          <span className="text-sm text-gray-600 px-4">
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
