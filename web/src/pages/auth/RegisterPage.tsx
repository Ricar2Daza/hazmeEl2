import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { registerSchema, RegisterInput } from '@/lib/schemas/zodSchemas';
import { useAuthStore } from '@/store/authStore';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerStore, isAuthenticated } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data: RegisterInput) => {
    try {
      await registerStore(data);
      toast.success('Registro exitoso. Verifica tu email.');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al registrarse';
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
          <h1 className="text-2xl font-bold text-gray-900 mt-6">Crear cuenta</h1>
          <p className="text-gray-600 mt-2">Únete a HazMe y comienza hoy mismo</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
          <div>
            <label className="label">Nombre completo</label>
            <input
              type="text"
              {...register('fullName')}
              className="input"
              placeholder="Juan Pérez"
            />
            {errors.fullName && (
              <p className="text-red-600 text-sm mt-1">{errors.fullName.message}</p>
            )}
          </div>

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
              placeholder="Mínimo 8 caracteres"
            />
            {errors.password && (
              <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="label">Teléfono (opcional)</label>
            <input
              type="tel"
              {...register('phone')}
              className="input"
              placeholder="+54 9 11 1234-5678"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full"
          >
            {isSubmitting ? 'Registrando...' : 'Crear cuenta'}
          </button>

          <p className="text-center text-sm text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:underline">
              Inicia sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
