import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares';
import { authenticateJWT } from '../middlewares';
import * as authService from '../services/auth.service';

export const registerSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Nombre completo debe tener al menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'Contraseña debe tener al menos 8 caracteres'),
    phone: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'Contraseña requerida'),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token requerido'),
  }),
});

export const verifySchema = z.object({
  params: z.object({
    token: z.string().min(1, 'Token requerido'),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).optional(),
    phone: z.string().nullish(),
    companyName: z.string().nullish(),
    portfolioUrl: z.string().nullish(),
    bio: z.string().nullish(),
    experienceYears: z.number().int().min(0).nullish(),
    skills: z.array(z.string()).optional(),
    locationAddress: z.string().nullish(),
  }),
});

const register = [
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({
        status: 'success',
        message: result.verificationRequired
          ? 'Usuario registrado exitosamente. Verifica tu email.'
          : 'Usuario registrado exitosamente. Ya puedes iniciar sesión.',
        ...result,
      });
    } catch (err) {
      next(err);
    }
  },
];

const login = [
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.login(req.body);
      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (err) {
      next(err);
    }
  },
];

const refresh = [
  validate(refreshSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.refresh(req.body.refreshToken);
      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (err) {
      next(err);
    }
  },
];

const verify = [
  validate(verifySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await authService.verifyEmail(req.params.token);
      res.status(200).json({
        status: 'success',
        message: 'Email verificado exitosamente',
      });
    } catch (err) {
      next(err);
    }
  },
];

const me = [
  authenticateJWT,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await authService.getMe(req.user!.id);
      res.status(200).json({
        status: 'success',
        data: user,
      });
    } catch (err) {
      next(err);
    }
  },
];

const updateProfile = [
  authenticateJWT,
  validate(updateProfileSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await authService.updateProfile(req.user!.id, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Perfil actualizado',
        data: user,
      });
    } catch (err) {
      next(err);
    }
  },
];

export default {
  register,
  login,
  refresh,
  verify,
  me,
  updateProfile,
};
