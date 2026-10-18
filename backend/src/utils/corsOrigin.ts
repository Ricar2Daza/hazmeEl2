/**
 * Comprobación de orígenes CORS compartida por Express y por Socket.io.
 *
 * La web se sirve normalmente en same-origin (Vite proxea /api y /socket.io),
 * por lo que CORS apenas interviene; pero sí importa para el móvil y para
 * cualquier llamada cross-origin.
 *
 * En desarrollo aceptamos además cualquier localhost y los dominios de túnel
 * (ngrok), porque en el plan gratuito el subdominio cambia en cada sesión y
 * fijarlo en CORS_ORIGIN rompería la app la próxima vez que se reinicie el
 * túnel. En producción sólo se permite la lista explícita.
 */
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;
const TUNNEL_ORIGIN = /^https:\/\/[a-z0-9-]+\.ngrok(-free)?\.(dev|app)$/;

const configuredOrigins = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isDev = process.env.NODE_ENV !== 'production';

export const isAllowedOrigin = (origin?: string): boolean => {
  // Sin cabecera Origin: peticiones same-origin, curl, Postman o el móvil.
  if (!origin) return true;
  if (configuredOrigins.includes(origin)) return true;
  if (!isDev) return false;
  return LOCAL_ORIGIN.test(origin) || TUNNEL_ORIGIN.test(origin);
};
