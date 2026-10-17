import jwt from 'jsonwebtoken';
import { AppError } from './AppError';

const JWT_SECRET = (process.env.JWT_SECRET as jwt.Secret) || 'fallback-secret-change-me';
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface TokenPayload {
  sub: string;
  iat?: number;
  exp?: number;
}

export const generateAccessToken = (userId: string): string => {
  return jwt.sign(
    { sub: userId },
    JWT_SECRET,
    {
      expiresIn: JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    } as jwt.SignOptions
  );
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { sub: userId },
    JWT_SECRET,
    {
      expiresIn: JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    } as jwt.SignOptions
  );
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (err) {
    throw new AppError('Token inválido o expirado', 401);
  }
};

