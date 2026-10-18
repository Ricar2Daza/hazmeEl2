import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { getSummaryForUsers, getMyRatingOf } from './ratings.service';

/**
 * Campos públicos de un usuario. Nunca exponemos email, teléfono ni hash
 * de contraseña en búsquedas ni perfiles públicos.
 */
const PUBLIC_USER_SELECT = {
  id: true,
  fullName: true,
  companyName: true,
  bio: true,
  experienceYears: true,
  skills: true,
  locationAddress: true,
  portfolioUrl: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

interface SearchUsersQuery {
  search?: string;
  page?: string;
  limit?: string;
}

/**
 * `skills` es un String[] y Prisma sólo permite comparación exacta de
 * elementos. Generamos variantes (tal cual, minúsculas y capitalizadas)
 * para que "react" encuentre "React" sin necesidad de SQL crudo.
 */
const buildSkillVariants = (term: string): string[] => {
  const lower = term.toLowerCase();
  const title = lower.charAt(0).toUpperCase() + lower.slice(1);
  return Array.from(new Set([term, lower, title]));
};

export const searchUsers = async (query: SearchUsersQuery, currentUserId?: string) => {
  const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit || '12', 10) || 12));
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {};

  // No te muestres a ti mismo en los resultados.
  if (currentUserId) {
    where.id = { not: currentUserId };
  }

  const search = query.search?.trim();
  if (search) {
    const terms = search.split(/\s+/).filter(Boolean).slice(0, 5);
    const skillTerms = terms.flatMap(buildSkillVariants);

    const insensitive = (term: string): Prisma.UserWhereInput => ({
      OR: [
        { fullName: { contains: term, mode: 'insensitive' } },
        { companyName: { contains: term, mode: 'insensitive' } },
        { bio: { contains: term, mode: 'insensitive' } },
      ],
    });

    where.OR = [
      ...terms.map(insensitive),
      { skills: { hasSome: skillTerms } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        ...PUBLIC_USER_SELECT,
        _count: { select: { publishedJobs: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const ratingMap = await getSummaryForUsers(users.map((u) => u.id));

  return {
    data: users.map((user) => ({
      ...user,
      rating: ratingMap.get(user.id) ?? { average: 0, count: 0 },
    })),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
};

export const getPublicProfile = async (userId: string, viewerId?: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...PUBLIC_USER_SELECT,
      _count: { select: { publishedJobs: true, myApplications: true } },
    },
  });

  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }

  // Trabajos abiertos del usuario para poder verlos/contactarlo desde su perfil.
  const openJobs = await prisma.job.findMany({
    where: { publisherId: userId, status: 'ABIERTO' },
    orderBy: { createdAt: 'desc' },
    take: 6,
    include: {
      category: true,
      _count: { select: { applications: true } },
    },
  });

  const [ratingMap, myRating] = await Promise.all([
    getSummaryForUsers([userId]),
    viewerId && viewerId !== userId ? getMyRatingOf(viewerId, userId) : Promise.resolve(null),
  ]);

  return {
    ...user,
    rating: ratingMap.get(userId) ?? { average: 0, count: 0 },
    myRating,
    openJobs,
  };
};
