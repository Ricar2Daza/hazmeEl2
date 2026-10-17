import { AppError } from './AppError';

export const normalizeMessageContent = (content: string): string => {
  const normalized = content.trim();
  if (!normalized) {
    throw new AppError('El mensaje no puede estar vacío', 400);
  }
  if (normalized.length > 2000) {
    throw new AppError('El mensaje no puede superar 2000 caracteres', 400);
  }
  return normalized;
};