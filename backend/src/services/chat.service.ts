import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { normalizeMessageContent } from '../utils/chatMessage';
import { emitToUser } from '../utils/socket';

const CONVERSATION_INCLUDE: Prisma.ApplicationInclude = {
  job: {
    select: {
      id: true,
      title: true,
      publisherId: true,
      publisher: { select: { id: true, fullName: true } },
    },
  },
  applicant: { select: { id: true, fullName: true } },
  chatMessages: {
    orderBy: { createdAt: 'desc' },
    take: 1,
    include: { sender: { select: { id: true, fullName: true } } },
  },
};

const MESSAGE_INCLUDE: Prisma.ChatMessageInclude = {
  sender: { select: { id: true, fullName: true } },
};

const findParticipantApplication = async (applicationId: string, userId: string) => {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      applicantId: true,
      job: { select: { id: true, title: true, publisherId: true } },
    },
  });

  if (!application) {
    throw new AppError('Conversación no encontrada', 404);
  }
  if (application.applicantId !== userId && application.job.publisherId !== userId) {
    throw new AppError('No tienes permiso para acceder a esta conversación', 403);
  }

  return application;
};

export const listConversations = async (userId: string) => {
  return prisma.application.findMany({
    where: {
      OR: [{ applicantId: userId }, { job: { publisherId: userId } }],
    },
    include: CONVERSATION_INCLUDE,
    orderBy: { updatedAt: 'desc' },
  });
};

export const listMessages = async (applicationId: string, userId: string) => {
  await findParticipantApplication(applicationId, userId);

  const messages = await prisma.chatMessage.findMany({
    where: { applicationId },
    include: MESSAGE_INCLUDE,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return messages.reverse();
};

export const sendMessage = async (applicationId: string, userId: string, content: string) => {
  const application = await findParticipantApplication(applicationId, userId);
  const message = await prisma.chatMessage.create({
    data: {
      applicationId,
      senderId: userId,
      content: normalizeMessageContent(content),
    },
    include: MESSAGE_INCLUDE,
  });
  const payload = { ...message, applicationId, jobTitle: application.job.title };

  emitToUser(application.applicantId, 'chat_message', payload);
  emitToUser(application.job.publisherId, 'chat_message', payload);

  return payload;
};