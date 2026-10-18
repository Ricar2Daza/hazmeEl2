import { z } from 'zod';

export const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Nombre completo debe tener al menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'Contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string().min(8, 'Confirma tu contraseña (mínimo 8 caracteres)'),
    phone: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const createJobSchema = z.object({
  title: z.string().min(5, 'Título debe tener al menos 5 caracteres'),
  description: z.string().min(20, 'Descripción debe tener al menos 20 caracteres'),
  categoryId: z.string().uuid('Categoría inválida'),
  budgetMin: z.number().int().min(0, 'Presupuesto mínimo no puede ser negativo'),
  budgetMax: z.number().int().min(0, 'Presupuesto máximo no puede ser negativo'),
  deadlineDate: z.coerce.date(),
  locationAddress: z.string().min(5, 'Dirección requerida'),
}).refine((data) => data.budgetMax >= data.budgetMin, {
  message: 'Presupuesto máximo debe ser mayor o igual al mínimo',
  path: ['budgetMax'],
});

export type CreateJobInput = z.infer<typeof createJobSchema>;

export const applyMessageSchema = z.object({
  message: z.string().max(2000, 'El mensaje no puede exceder 2000 caracteres').optional().nullable(),
});

export type ApplyMessageInput = z.infer<typeof applyMessageSchema>;

export const editProfileSchema = z.object({
  fullName: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').optional(),
  phone: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
  portfolioUrl: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  experienceYears: z.number().int().min(0, 'Años no pueden ser negativos').nullable().optional(),
  skills: z.array(z.string()).optional(),
  locationAddress: z.string().nullable().optional(),
});

export type EditProfileInput = z.infer<typeof editProfileSchema>;
