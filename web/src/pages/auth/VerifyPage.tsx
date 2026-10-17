import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { CheckCircle2, XCircle } from 'lucide-react';
import api from '@/lib/axios';
import Logo from '@/components/ui/Logo';

export default function VerifyPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Token inválido');
        return;
      }
      try {
        const res = await api.get(`/auth/verify/${token}`);
        setStatus('success');
        setMessage(res.data?.message || 'Email verificado exitosamente');
        toast.success('Email verificado exitosamente');
      } catch (err: any) {
        setStatus('error');
        const msg = err?.response?.data?.message || 'Error al verificar el email';
        setMessage(msg);
        toast.error(msg);
      }
    };
    verify();
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="card w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <Logo linked={false} />
        </div>
        {status === 'loading' && (
          <>
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-accent-100 border-t-accent-500" />
            <h1 className="text-xl font-semibold text-ink">Verificando email...</h1>
            <p className="mt-2 text-ink-soft">Espera un momento</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-600" aria-hidden="true" />
            <h1 className="text-xl font-semibold text-ink">¡Verificación exitosa!</h1>
            <p className="mt-2 text-ink-soft">{message}</p>
            <Link to="/login" className="btn-primary mt-6 w-full">
              Ir a iniciar sesión
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="mx-auto mb-4 h-12 w-12 text-red-600 dark:text-red-400" aria-hidden="true" />
            <h1 className="text-xl font-semibold text-ink">Error de verificación</h1>
            <p className="mt-2 text-ink-soft">{message}</p>
            <Link to="/" className="btn-secondary mt-6 w-full">
              Volver al inicio
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
