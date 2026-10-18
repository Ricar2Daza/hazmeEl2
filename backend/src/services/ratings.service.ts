import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';

export const MIN_SCORE = 1;
export const MAX_SCORE = 5;

const RATER_SELECT = {
  id: true,
  fullName: true,
  companyName: true,
} satisfies Prisma.UserSelect;

/** Media y número de valoraciones de un conjunto de usuarios. */
export const getSummaryForUsers = async (userIds: string[]) => {
  const map = new Map<string, { average: number; count: number }>();
  if (userIds.length === 0) return map;

  const grouped = await prisma.rating.groupBy({
    by: ['ratedId'],
    where: { ratedId: { in: userIds } },
    _avg: { score: true },
    _count: { score: true },
  });

  for (const row of grouped) {
    map.set(row.ratedId, {
      average: row._avg.score ? Math.round(row._avg.score * 10) / 10 : 0,
      count: row._count.score,
    });
  }
  return map;
};

export const getMyRatingOf = async (raterId: string, ratedId: string) =>
  prisma.rating.findUnique({
    where: { raterId_ratedId: { raterId, ratedId } },
  });

/**
 * Crea o actualiza la valoración que `raterId` hace de `ratedId`.
 * Regla: una sola valoración por par (se sobrescribe) y sin autovaloraciones.
 */
export const createOrUpdateRating = async (
  raterId: string,
  ratedId: string,
  score: number,
  comment?: string | null
) => {
  if (raterId === ratedId) {
    throw new AppError('No puedes valorarte a ti mismo', 400);
  }
  if (!Number.isInteger(score) || score < MIN_SCORE || score > MAX_SCORE) {
    throw new AppError(`La puntuación debe estar entre ${MIN_SCORE} y ${MAX_SCORE}`, 400);
  }

  const rated = await prisma.user.findUnique({
    where: { id: ratedId },
    select: { id: true },
  });
  if (!rated) {
    throw new AppError('Usuario no encontrado', 404);
  }

  const cleanComment = comment?.trim() ? comment.trim().slice(0, 1000) : null;

  return prisma.rating.upsert({
    where: { raterId_ratedId: { raterId, ratedId } },
    update: { score, comment: cleanComment },
    create: { raterId, ratedId, score, comment: cleanComment },
  });
};

export const listForUser = async (userId: string, viewerId?: string) => {
  const [ratings, aggregate] = await Promise.all([
    prisma.rating.findMany({
      where: { ratedId: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { rater: { select: RATER_SELECT } },
    }),
    prisma.rating.aggregate({
      where: { ratedId: userId },
      _avg: { score: true },
      _count: { score: true },
    }),
  ]);

  const myRating = viewerId ? await getMyRatingOf(viewerId, userId) : null;

  return {
    data: ratings,
    average: aggregate._avg.score ? Math.round(aggregate._avg.score * 10) / 10 : 0,
    count: aggregate._count.score,
    myRating,
  };
};
