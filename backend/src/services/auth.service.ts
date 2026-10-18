import crypto from 'crypto';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt';

interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface ProfileInput {
  fullName?: string;
  phone?: string | null;
  companyName?: string | null;
  portfolioUrl?: string | null;
  bio?: string | null;
  experienceYears?: number | null;
  skills?: string[];
  locationAddress?: string | null;
}

const sanitizeUser = (user: any) => {
  const { passwordHash, verificationToken, refreshToken, ...rest } = user;
  return rest;
};

/**
 * La verificación por email sólo tiene sentido con un SMTP real. En este MVP el
 * correo está mockeado (sólo se imprime en la consola del backend), así que con
 * EMAIL_VERIFICATION_REQUIRED=false las cuentas nacen activas y se puede entrar
 * directamente. Con la variable en true (o sin definir) se comporta como antes.
 */
const isEmailVerificationRequired = () =>
  (process.env.EMAIL_VERIFICATION_REQUIRED ?? 'true').toLowerCase() !== 'false';

export const register = async (input: RegisterInput) => {
  const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (existing) {
    throw new AppError('Ya existe un usuario con este email', 409);
  }

  const verificationRequired = isEmailVerificationRequired();
  const passwordHash = await hashPassword(input.password);
  const verificationToken = crypto.randomBytes(32).toString('hex');

  const user = await prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      passwordHash,
      fullName: input.fullName,
      phone: input.phone,
      verificationToken: verificationRequired ? verificationToken : null,
      emailVerified: !verificationRequired,
    },
  });

  if (verificationRequired) {
    const verifyLink = `/api/auth/verify/${verificationToken}`;
    console.log(`\n📧 [EMAIL MOCK] Enviado a ${user.email}: Verifica tu email en ${verifyLink}\n`);
  }

  return { user: sanitizeUser(user), verificationRequired };
};

export const login = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });

  if (!user || !(await comparePassword(input.password, user.passwordHash))) {
    throw new AppError('Email o contraseña incorrectos', 401);
  }

  if (isEmailVerificationRequired() && !user.emailVerified) {
    throw new AppError('Debes verificar tu email antes de iniciar sesión', 403);
  }

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  return {
    accessToken,
    refreshToken,
    user: sanitizeUser(user),
  };
};

export const refresh = async (refreshToken: string) => {
  const payload = verifyToken(refreshToken);

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.refreshToken !== refreshToken) {
    throw new AppError('Refresh token inválido', 401);
  }

  const accessToken = generateAccessToken(user.id);
  const newRefreshToken = generateRefreshToken(user.id);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: newRefreshToken },
  });

  return {
    accessToken,
    refreshToken: newRefreshToken,
    user: sanitizeUser(user),
  };
};

export const verifyEmail = async (token: string) => {
  const user = await prisma.user.findFirst({ where: { verificationToken: token } });
  if (!user) {
    throw new AppError('Token de verificación inválido o expirado', 400);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verificationToken: null,
    },
  });

  return true;
};

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }
  return sanitizeUser(user);
};

export const updateProfile = async (userId: string, input: ProfileInput) => {
  const data: any = {};
  if (input.fullName !== undefined) data.fullName = input.fullName;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.companyName !== undefined) data.companyName = input.companyName;
  if (input.portfolioUrl !== undefined) data.portfolioUrl = input.portfolioUrl;
  if (input.bio !== undefined) data.bio = input.bio;
  if (input.experienceYears !== undefined) data.experienceYears = input.experienceYears;
  if (input.skills !== undefined) data.skills = input.skills;
  if (input.locationAddress !== undefined) data.locationAddress = input.locationAddress;

  const user = await prisma.user.update({
    where: { id: userId },
    data,
  });

  return sanitizeUser(user);
};
