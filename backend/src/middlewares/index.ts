import { Request, Response, NextFunction } from 'express';
import { RequestHandler } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '../utils/AppError';
import { verifyToken } from '../utils/jwt';

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Token de autenticación requerido', 401);
    }

    const token = authHeader.slice(7);
    const payload = verifyToken(token);

    req.user = { id: payload.sub };
    next();
  } catch (err) {
    next(err);
  }
};

export const optionalAuthenticateJWT = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    next();
    return;
  }

  try {
    if (!authHeader.startsWith('Bearer ')) {
      throw new AppError('Token de autenticación inválido', 401);
    }
    const payload = verifyToken(authHeader.slice(7));
    req.user = { id: payload.sub };
    next();
  } catch (err) {
    next(err);
  }
};

export const validate = (schema: ZodSchema): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      if (!result.success) {
        const errors = result.error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        }));
        throw new AppError(`Error de validación: ${JSON.stringify(errors)}`, 400);
      }

      req.body = result.data.body;
      req.params = result.data.params;
      req.query = result.data.query;

      next();
    } catch (err) {
      next(err);
    }
  };
};

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      statusCode: err.statusCode,
      message: err.message,
    });
    return;
  }

  console.error('[ERROR] No manejado:', err);
  res.status(500).json({
    status: 'error',
    statusCode: 500,
    message: 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err?.stack }),
  });
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  next(new AppError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`, 404));
};
