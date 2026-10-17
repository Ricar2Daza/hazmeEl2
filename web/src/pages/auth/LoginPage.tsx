import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { loginSchema, LoginInput } from '@/lib/schemas/zodSchemas';
import { useAuthStore } from '@/store/authStore';
import Logo from '@/components/ui/Logo';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuthStore();
  const [showVerifyAlert, setShowVerifyAlert] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  if (isAuthenticated && user?.emailVerified) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isAuthenticated && !user?.emailVerified) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data: LoginInput) => {
    try {
      await login(data);
      const authUser = useAuthStore.getState().user;
      if (authUser && !authUser.emailVerified) {
        setShowVerifyAlert(true);
        toast('Tu email aún no está verificado', { icon: '⚠️' });
      } else {
        toast.success('Inicio de sesión exitoso');
      }
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al iniciar sesión';
      toast.error(msg);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo linked={false} />
          <h1 className="mt-6 text-xl font-semibold text-ink">Iniciar sesión</h1>
          <p className="mt-2 text-sm text-ink-soft">Bienvenido de vuelta</p>
        </div>

        {showVerifyAlert && (
          <div className="mb-4 rounded-lg border border-accent-300 bg-accent-50 p-4 text-sm text-accent-800 dark:border-accent-800 dark:bg-accent-900/30 dark:text-accent-300">
            Tu email aún no está verificado. Revisa tu bandeja de entrada.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              {...register('email')}
              className="input"
              placeholder="tu@email.com"
            />
            {errors.email && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="label">Contraseña</label>
            <input
              type="password"
              {...register('password')}
              className="input"
              placeholder="Ingresa tu contraseña"
            />
            {errors.password && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full"
          >
            {isSubmitting ? 'Iniciando...' : 'Iniciar sesión'}
          </button>

          <p className="text-center text-sm text-ink-soft">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="font-medium hover:underline">
              Regístrate
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
