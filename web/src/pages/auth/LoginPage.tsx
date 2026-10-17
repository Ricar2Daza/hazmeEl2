import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { loginSchema, LoginInput } from '@/lib/schemas/zodSchemas';
import { useAuthStore } from '@/store/authStore';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <span className="text-3xl font-bold text-primary-600">HazMe</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-6">Iniciar sesión</h1>
          <p className="text-gray-600 mt-2">Bienvenido de vuelta</p>
        </div>

        {showVerifyAlert && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-sm">
            ⚠️ Tu email aún no está verificado. Revisa tu bandeja de entrada.
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
              <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
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
              <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full"
          >
            {isSubmitting ? 'Iniciando...' : 'Iniciar sesión'}
          </button>

          <p className="text-center text-sm text-gray-600">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-primary-600 font-medium hover:underline">
              Regístrate
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
