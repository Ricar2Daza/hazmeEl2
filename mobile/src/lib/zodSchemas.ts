import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Nombre completo debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Contraseña debe tener al menos 8 caracteres'),
  phone: z.string().optional(),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
});

export const jobCreateSchema = z.object({
  title: z.string().min(5, 'Título debe tener al menos 5 caracteres'),
  description: z.string().min(20, 'Descripción debe tener al menos 20 caracteres'),
  locationAddress: z.string().min(5, 'Dirección requerida'),
  locationLat: z.number({ required_error: 'Latitud requerida' }),
  locationLng: z.number({ required_error: 'Longitud requerida' }),
  budgetMin: z.number().int().min(0, 'Presupuesto mínimo inválido'),
  budgetMax: z.number().int().min(0, 'Presupuesto máximo inválido'),
  deadlineDate: z.coerce.date(),
  categoryId: z.string().uuid('Categoría inválida'),
}).refine((data) => data.budgetMin <= data.budgetMax, {
  message: 'Presupuesto mínimo debe ser menor o igual al máximo',
  path: ['budgetMin'],
});

export const applySchema = z.object({
  message: z.string().max(2000, 'Mensaje muy largo').optional().nullable(),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Nombre muy corto').optional(),
  phone: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
  portfolioUrl: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  experienceYears: z.number().int().min(0).nullable().optional(),
  skills: z.array(z.string()).optional(),
  locationAddress: z.string().nullable().optional(),
  locationLat: z.number().nullable().optional(),
  locationLng: z.number().nullable().optional(),
});

export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
export type JobCreateForm = z.infer<typeof jobCreateSchema>;
export type ApplyForm = z.infer<typeof applySchema>;
export type UpdateProfileForm = z.infer<typeof updateProfileSchema>;
