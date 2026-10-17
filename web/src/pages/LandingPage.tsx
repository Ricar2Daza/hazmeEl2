import { Link, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function LandingPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-primary-600">HazMe</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors px-4 py-2"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/register"
                className="btn-primary"
              >
                Registrarse
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6">
                <span>💼</span>
                <span>Conectamos talentos con oportunidades</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Encuentra el trabajo
                <span className="text-primary-600"> perfecto </span>
                o publica tu proyecto
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-xl">
                HazMe es la plataforma donde profesionales independientes y empresas se encuentran. Publica trabajos, recibe postulaciones y gestiona proyectos en un solo lugar.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register"
                  className="btn-primary text-base px-8 py-3"
                >
                  Comenzar gratis
                </Link>
                <Link
                  to="/login"
                  className="btn-secondary text-base px-8 py-3"
                >
                  Ya tengo cuenta
                </Link>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary-400 to-indigo-500 rounded-3xl blur-2xl opacity-20" />
              <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-2xl">
                      🔧
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">Desarrollador Web</div>
                      <div className="text-sm text-gray-500">Presupuesto: $500 - $1.000</div>
                    </div>
                    <span className="badge-green">Activo</span>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">
                      🎨
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">Diseñador Gráfico</div>
                      <div className="text-sm text-gray-500">Presupuesto: $200 - $500</div>
                    </div>
                    <span className="badge-blue">12 postulantes</span>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">
                      📱
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">App Móvil React Native</div>
                      <div className="text-sm text-gray-500">Presupuesto: $2.000 - $5.000</div>
                    </div>
                    <span className="badge-yellow">Urgente</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">¿Por qué elegir HazMe?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Todo lo que necesitas para gestionar trabajos y postulaciones de manera simple y eficiente.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                🚀
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Publica en minutos</h3>
              <p className="text-gray-600">
                Crea tu publicación de trabajo con un formulario simple y comienza a recibir postulaciones al instante.
              </p>
            </div>
            <div className="card text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                ✅
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Gestiona postulantes</h3>
              <p className="text-gray-600">
                Revisa perfiles, lee mensajes y acepta o rechaza postulaciones con un solo clic.
              </p>
            </div>
            <div className="card text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                🔔
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Notificaciones en vivo</h3>
              <p className="text-gray-600">
                Recibe alertas instantáneas cuando alguien se postula o cambia el estado de tu aplicación.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <span className="text-2xl font-bold text-primary-400">HazMe</span>
              <p className="text-gray-400 mt-2">Conectando talentos con oportunidades</p>
            </div>
            <div className="text-sm text-gray-400">
              © {new Date().getFullYear()} HazMe. Todos los derechos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
