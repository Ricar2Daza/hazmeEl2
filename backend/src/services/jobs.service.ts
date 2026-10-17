import { Prisma, JobStatus } from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { emitToUser } from '../utils/socket';

const BASE_JOB_INCLUDE = {
  publisher: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      companyName: true,
      portfolioUrl: true,
      bio: true,
      experienceYears: true,
      skills: true,
      locationAddress: true,
      createdAt: true,
    },
  },
  category: true,
};

interface CreateJobInput {
  title: string;
  description: string;
  locationAddress: string;
  budgetMin: number;
  budgetMax: number;
  deadlineDate: Date;
  categoryId: string;
}

interface UpdateJobInput {
  title?: string;
  description?: string;
  locationAddress?: string;
  budgetMin?: number;
  budgetMax?: number;
  deadlineDate?: Date;
  categoryId?: string;
  status?: JobStatus;
}

interface ListJobsQuery {
  search?: string;
  category?: string;
  budgetMin?: string;
  budgetMax?: string;
  deadlineFrom?: string;
  deadlineTo?: string;
  status?: JobStatus;
  page?: string;
  limit?: string;
  sortBy?: string;
}

export const createJob = async (publisherId: string, input: CreateJobInput) => {
  if (input.budgetMin > input.budgetMax) {
    throw new AppError('budgetMin no puede ser mayor que budgetMax', 400);
  }

  const job = await prisma.job.create({
    data: {
      ...input,
      publisherId,
    },
    include: BASE_JOB_INCLUDE,
  });

  return job;
};

export const updateJob = async (jobId: string, publisherId: string, input: UpdateJobInput) => {
  const existing = await prisma.job.findUnique({ where: { id: jobId } });
  if (!existing) {
    throw new AppError('Trabajo no encontrado', 404);
  }
  if (existing.publisherId !== publisherId) {
    throw new AppError('No tienes permiso para editar este trabajo', 403);
  }
  if (existing.status === JobStatus.CANCELADO) {
    throw new AppError('No puedes editar un trabajo cancelado', 400);
  }

  if (
    (input.budgetMin !== undefined && input.budgetMax !== undefined && input.budgetMin > input.budgetMax) ||
    (input.budgetMin !== undefined && input.budgetMin > existing.budgetMax) ||
    (input.budgetMax !== undefined && existing.budgetMin > input.budgetMax)
  ) {
    throw new AppError('Rango de presupuesto inválido', 400);
  }

  const updated = await prisma.job.update({
    where: { id: jobId },
    data: input,
    include: BASE_JOB_INCLUDE,
  });

  const applicants = await prisma.application.findMany({
    where: { jobId },
    select: { applicantId: true },
  });

  for (const a of applicants) {
    await prisma.notification.create({
      data: {
        userId: a.applicantId,
        type: 'JOB_UPDATED',
        title: 'Trabajo actualizado',
        message: `El trabajo "${updated.title}" ha sido actualizado por el publicador.`,
        relatedJobId: jobId,
      },
    });
    emitToUser(a.applicantId, 'job_updated', { jobId, job: updated });
  }

  return updated;
};

export const cancelJob = async (jobId: string, publisherId: string) => {
  const existing = await prisma.job.findUnique({ where: { id: jobId } });
  if (!existing) {
    throw new AppError('Trabajo no encontrado', 404);
  }
  if (existing.publisherId !== publisherId) {
    throw new AppError('No tienes permiso para cancelar este trabajo', 403);
  }

  return prisma.job.update({
    where: { id: jobId },
    data: { status: JobStatus.CANCELADO },
    include: BASE_JOB_INCLUDE,
  });
};

export const getMyPublished = async (publisherId: string) => {
  return prisma.job.findMany({
    where: { publisherId },
    orderBy: { createdAt: 'desc' },
    include: {
      ...BASE_JOB_INCLUDE,
      _count: {
        select: { applications: true },
      },
    },
  });
};

export const listJobs = async (query: ListJobsQuery, _userId?: string) => {
  const page = parseInt(query.page || '1', 10);
  const limit = parseInt(query.limit || '20', 10);
  const skip = (page - 1) * limit;

  const where: Prisma.JobWhereInput = {};
  where.status = query.status || JobStatus.ABIERTO;
  if (_userId) where.publisherId = { not: _userId };

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
      { locationAddress: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  if (query.category) {
    where.category = {
      OR: [{ slug: query.category }, { id: query.category }, { name: { contains: query.category, mode: 'insensitive' } }],
    };
  }

  if (query.budgetMin) {
    where.budgetMax = { gte: parseInt(query.budgetMin, 10) };
  }
  if (query.budgetMax) {
    where.budgetMin = { lte: parseInt(query.budgetMax, 10) };
  }

  if (query.deadlineFrom) {
    where.deadlineDate = { ...(where.deadlineDate as any), gte: new Date(query.deadlineFrom) };
  }
  if (query.deadlineTo) {
    where.deadlineDate = { ...(where.deadlineDate as any), lte: new Date(query.deadlineTo) };
  }

  const sortBy = query.sortBy || 'createdAt';
  const sortMap: Record<string, Prisma.JobOrderByWithRelationInput> = {
    createdAt: { createdAt: 'desc' },
    deadlineDate: { deadlineDate: 'asc' },
    budgetAsc: { budgetMin: 'asc' },
    budgetDesc: { budgetMax: 'desc' },
  };
  const orderBy = sortMap[sortBy] || sortMap.createdAt;

  const jobs = await prisma.job.findMany({
    where,
    skip,
    take: limit,
    orderBy,
    include: BASE_JOB_INCLUDE,
  });

  const total = await prisma.job.count({ where });
  const totalPages = Math.ceil(total / limit);

  return {
    data: jobs,
    page,
    limit,
    total,
    totalPages,
  };
};

export const getJobById = async (jobId: string, userId?: string) => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      ...BASE_JOB_INCLUDE,
      applications:
        userId !== undefined
          ? {
              include: {
                applicant: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phone: true,
                    companyName: true,
                    portfolioUrl: true,
                    bio: true,
                    experienceYears: true,
                    skills: true,
                    locationAddress: true,
                  },
                },
              },
            }
          : false,
    },
  });

  if (!job) {
    throw new AppError('Trabajo no encontrado', 404);
  }

  if (userId && job.publisherId !== userId) {
    delete (job as any).applications;
  }

  if (!userId) {
    delete (job as any).applications;
  }

  return job;
};
