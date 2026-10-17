import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md card text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900">Verificando email...</h1>
            <p className="text-gray-600 mt-2">Espera un momento</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">¡Verificación exitosa!</h1>
            <p className="text-gray-600 mt-2">{message}</p>
            <Link to="/login" className="btn-primary w-full mt-6">
              Ir a iniciar sesión
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Error de verificación</h1>
            <p className="text-gray-600 mt-2">{message}</p>
            <Link to="/" className="btn-secondary w-full mt-6">
              Volver al inicio
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
