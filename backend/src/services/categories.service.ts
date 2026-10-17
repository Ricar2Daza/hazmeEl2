import prisma from '../utils/prisma';

export const listAll = async () => {
  return prisma.category.findMany({
    orderBy: { name: 'asc' },
  });
};
