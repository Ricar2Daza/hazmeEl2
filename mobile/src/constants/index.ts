import { Platform } from 'react-native';

const DEV_BACKEND_HOST =
  Platform.OS === 'web'
    ? 'http://localhost:3000'
    : 'http://10.0.2.2:3000';

export const API_BASE_URL = `${DEV_BACKEND_HOST}/api`;
export const SOCKET_URL = DEV_BACKEND_HOST;

export const COLORS = {
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  secondary: '#8b5cf6',
  tertiary: '#06b6d4',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  gray50: '#f8fafc',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray300: '#cbd5e1',
  gray400: '#94a3b8',
  gray500: '#64748b',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1e293b',
  gray900: '#0f172a',
  white: '#ffffff',
  black: '#000000',
  background: '#f8fafc',
  surface: '#ffffff',
};

export const APPLICATION_STATUS_COLORS: Record<string, string> = {
  PENDIENTE: COLORS.warning,
  ACEPTADA: COLORS.success,
  RECHAZADA: COLORS.danger,
};

export const JOB_STATUS_COLORS: Record<string, string> = {
  ABIERTO: COLORS.info,
  EN_PROGRESO: COLORS.warning,
  FINALIZADO: COLORS.success,
  CANCELADO: COLORS.danger,
};

export const CATEGORIES_DEFAULT = [
  { id: '1', name: 'Tecnología', slug: 'tecnologia' },
  { id: '2', name: 'Construcción', slug: 'construccion' },
  { id: '3', name: 'Diseño', slug: 'diseno' },
  { id: '4', name: 'Limpieza', slug: 'limpieza' },
  { id: '5', name: 'Mantenimiento', slug: 'mantenimiento' },
  { id: '6', name: 'Educación', slug: 'educacion' },
];
