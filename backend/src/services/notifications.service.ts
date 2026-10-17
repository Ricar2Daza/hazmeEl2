import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';

interface ListQuery {
  page?: string;
  limit?: string;
}

export const listNotifications = async (userId: string, query: ListQuery) => {
  const page = parseInt(query.page || '1', 10);
  const limit = parseInt(query.limit || '20', 10);
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        relatedJob: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    }),
    prisma.notification.count({ where: { userId } }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    page,
    limit,
    total,
    totalPages,
  };
};

export const markAsRead = async (notificationId: string, userId: string) => {
  const notif = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notif) {
    throw new AppError('Notificación no encontrada', 404);
  }
  if (notif.userId !== userId) {
    throw new AppError('No tienes permiso para modificar esta notificación', 403);
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
};

export const markAllAsRead = async (userId: string) => {
  const result = await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
  return { count: result.count };
};

export const getUnreadCount = async (userId: string) => {
  return prisma.notification.count({
    where: { userId, read: false },
  });
};
