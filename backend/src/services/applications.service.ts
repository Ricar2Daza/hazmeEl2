import { Prisma, ApplicationStatus, JobStatus, NotificationType } from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { emitToUser } from '../utils/socket';
import { sendApplicationAcceptedEmail, sendNewApplicationEmail } from '../utils/email';

const APPLICATION_INCLUDE: Prisma.ApplicationInclude = {
  job: {
    include: {
      publisher: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          companyName: true,
        },
      },
      category: true,
    },
  },
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
};

export const applyToJob = async (jobId: string, applicantId: string, message?: string | null) => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { publisher: { select: { email: true, fullName: true } } },
  });
  if (!job) {
    throw new AppError('Trabajo no encontrado', 404);
  }
  if (job.publisherId === applicantId) {
    throw new AppError('No puedes postularte a tu propio trabajo', 403);
  }
  if (job.status !== JobStatus.ABIERTO) {
    throw new AppError(`No puedes postularte a un trabajo ${job.status}`, 400);
  }

  const existing = await prisma.application.findUnique({
    where: { jobId_applicantId: { jobId, applicantId } },
  });
  if (existing) {
    throw new AppError('Ya te has postulado a este trabajo', 409);
  }

  const application = await prisma.application.create({
    data: {
      jobId,
      applicantId,
      message: message || undefined,
      status: ApplicationStatus.PENDIENTE,
    },
    include: APPLICATION_INCLUDE,
  });

  const notification = await prisma.notification.create({
    data: {
      userId: job.publisherId,
      type: NotificationType.NEW_APPLICATION,
      title: 'Nueva postulación',
      message: `${application.applicant.fullName} se ha postulado a tu trabajo "${job.title}".`,
      relatedJobId: jobId,
    },
  });

  emitToUser(job.publisherId, 'new_application', {
    application,
    notification,
  });
  await sendNewApplicationEmail({
    recipientEmail: job.publisher.email,
    recipientName: job.publisher.fullName,
    senderName: application.applicant.fullName,
    jobTitle: application.job.title,
    jobId: application.jobId,
    applicationId: application.id,
  });

  return application;
};

export const listMine = async (applicantId: string) => {
  return prisma.application.findMany({
    where: { applicantId },
    orderBy: { createdAt: 'desc' },
    include: APPLICATION_INCLUDE,
  });
};

export const listJobApplications = async (jobId: string, publisherId: string) => {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {
    throw new AppError('Trabajo no encontrado', 404);
  }
  if (job.publisherId !== publisherId) {
    throw new AppError('No tienes permiso para ver estas postulaciones', 403);
  }

  return prisma.application.findMany({
    where: { jobId },
    orderBy: { createdAt: 'desc' },
    include: APPLICATION_INCLUDE,
  });
};

const getPublisherFromApplication = async (applicationId: string) => {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      job: {
        select: {
          publisherId: true,
          title: true,
          status: true,
          publisher: { select: { fullName: true } },
        },
      },
    },
  });
  if (!app) {
    throw new AppError('Postulación no encontrada', 404);
  }
  return app;
};

export const acceptApplication = async (applicationId: string, publisherId: string) => {
  const app = await getPublisherFromApplication(applicationId);
  if (app.job.publisherId !== publisherId) {
    throw new AppError('No tienes permiso para gestionar esta postulación', 403);
  }
  if (app.status !== ApplicationStatus.PENDIENTE) {
    throw new AppError('Esta postulación ya fue gestionada', 409);
  }

  const updated = await prisma.$transaction(async (transaction) => {
    const claimedJob = await transaction.job.updateMany({
      where: { id: app.jobId, status: JobStatus.ABIERTO },
      data: { status: JobStatus.EN_PROGRESO },
    });
    if (claimedJob.count !== 1) {
      throw new AppError('Ya elegiste a un profesional para este trabajo', 409);
    }

    const acceptedApplication = await transaction.application.updateMany({
      where: { id: applicationId, status: ApplicationStatus.PENDIENTE },
      data: { status: ApplicationStatus.ACEPTADA },
    });
    if (acceptedApplication.count !== 1) {
      throw new AppError('Esta postulación ya fue gestionada', 409);
    }

    return transaction.application.findUniqueOrThrow({
      where: { id: applicationId },
      include: APPLICATION_INCLUDE,
    });
  });

  const notification = await prisma.notification.create({
    data: {
      userId: updated.applicantId,
      type: NotificationType.APPLICATION_ACCEPTED,
      title: '¡Postulación aceptada!',
      message: `Tu postulación a "${app.job.title}" ha sido aceptada. ¡Contacta con el cliente!`,
      relatedJobId: app.jobId,
    },
  });

  emitToUser(updated.applicantId, 'application_accepted', {
    application: updated,
    notification,
  });
  await sendApplicationAcceptedEmail({
    recipientEmail: updated.applicant.email,
    recipientName: updated.applicant.fullName,
    senderName: app.job.publisher.fullName,
    jobTitle: updated.job.title,
    jobId: updated.jobId,
    applicationId: updated.id,
  });

  return updated;
};

export const rejectApplication = async (applicationId: string, publisherId: string) => {
  const app = await getPublisherFromApplication(applicationId);
  if (app.job.publisherId !== publisherId) {
    throw new AppError('No tienes permiso para gestionar esta postulación', 403);
  }

  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: { status: ApplicationStatus.RECHAZADA },
    include: APPLICATION_INCLUDE,
  });

  const notification = await prisma.notification.create({
    data: {
      userId: updated.applicantId,
      type: NotificationType.APPLICATION_REJECTED,
      title: 'Postulación rechazada',
      message: `Tu postulación a "${app.job.title}" ha sido rechazada. No te desanimes, hay muchos otros trabajos.`,
      relatedJobId: app.jobId,
    },
  });

  emitToUser(updated.applicantId, 'application_rejected', {
    application: updated,
    notification,
  });

  return updated;
};
