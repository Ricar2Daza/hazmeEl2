import { Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import Logo from '@/components/ui/Logo';
import ThemeToggle from '@/components/ui/ThemeToggle';

interface PublicJob {
  id: string;
  title: string;
  budgetMin: number;
  budgetMax: number;
  locationAddress: string;
  category?: { name: string };
  publisher?: { fullName: string; companyName?: string | null };
}

export default function LandingPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['publicJobs', 'landing'],
    queryFn: async () => {
      const response = await api.get('/jobs', { params: { limit: 6, status: 'ABIERTO' } });
      return response.data.data as PublicJob[];
    },
  });

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-30 border-b border-line bg-card">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Logo size="sm" linked={false} />
          <nav aria-label="Cuenta" className="flex min-w-0 items-center gap-1.5 sm:gap-3">
            <ThemeToggle />
            <Link
              to="/login"
              className="px-2 py-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink sm:hidden"
            >
              Entrar
            </Link>
            <Link
              to="/login"
              className="hidden px-2 py-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink sm:inline-flex"
            >
              Iniciar sesión
            </Link>
            <Link to="/register" className="btn-primary min-h-10 px-3 sm:px-4">
              Crear cuenta
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-12 gap-x-6 gap-y-6 px-4 py-5 sm:px-6 sm:py-10 lg:gap-y-10 lg:px-8">
        <section className="order-2 col-span-12 lg:order-1 lg:col-span-3">
          <p className="text-xs font-semibold uppercase text-muted">HazmeEl2 / Bolsa de trabajo</p>
          <h1 className="mt-4 text-xl font-semibold leading-snug text-ink">
            Trabajo independiente, sin vueltas.
          </h1>
          <p className="mt-3 text-sm leading-6 text-ink-soft">
            Encuentra proyectos publicados por otras personas o conecta con profesionales para resolver lo que necesitas.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/register" className="btn-primary">
              Empezar
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link to="/login" className="btn-secondary">
              Ya tengo cuenta
            </Link>
          </div>
          <div className="mt-8 border-t border-line pt-4 text-xs text-muted">
            Publica un trabajo · Recibe propuestas · Elige a tu profesional
          </div>
        </section>

        <section className="order-1 col-span-12 lg:order-2 lg:col-span-9" aria-labelledby="open-jobs-title">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
            <div>
              <p className="text-xs font-medium text-muted">Oportunidades</p>
              <h2 id="open-jobs-title" className="mt-1 text-xl font-semibold text-ink">Trabajos abiertos</h2>
            </div>
            <p className="text-sm text-muted">{isLoading ? 'Cargando...' : `${jobs.length} recientes`}</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-12 gap-3 sm:gap-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="col-span-12 animate-pulse rounded-lg border border-line bg-card p-6 sm:col-span-6 xl:col-span-4">
                  <div className="h-4 w-1/3 rounded bg-subtle" />
                  <div className="mt-5 h-5 w-3/4 rounded bg-subtle" />
                  <div className="mt-3 h-4 w-1/2 rounded bg-subtle" />
                  <div className="mt-8 h-4 w-2/3 rounded bg-subtle" />
                </div>
              ))}
            </div>
          ) : jobs.length ? (
            <div className="grid grid-cols-12 gap-3 sm:gap-4">
              {jobs.map((job) => (
                <Link
                  key={job.id}
                  to={`/trabajos/${job.id}`}
                  className="group col-span-12 flex flex-col rounded-lg border border-line bg-card p-6 transition-colors hover:border-line-strong sm:col-span-6 xl:col-span-4"
                >
                  <div className="flex min-h-20 flex-col">
                    <p className="text-sm font-medium text-ink-soft">
                      {job.publisher?.companyName || job.publisher?.fullName || 'Publicante'}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-ink group-hover:text-primary-500">{job.title}</h3>
                  </div>
                  <div className="mt-5 space-y-2 border-t border-line pt-4 text-[13px] text-muted">
                    <p>{job.category?.name || 'Trabajo'} <span aria-hidden="true">·</span> {job.locationAddress}</p>
                    <p>${job.budgetMin.toLocaleString('es')}–${job.budgetMax.toLocaleString('es')}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-line bg-card px-6 py-10 text-sm text-ink-soft">
              No hay trabajos abiertos ahora. Crea una cuenta para publicar el primero.
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-line bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <Logo size="sm" linked={false} />
          <p className="text-xs text-muted">Conectando personas y oportunidades</p>
        </div>
      </footer>
    </div>
  );
}
