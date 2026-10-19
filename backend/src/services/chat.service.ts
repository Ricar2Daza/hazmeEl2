import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { normalizeMessageContent } from '../utils/chatMessage';
import { emitToUser } from '../utils/socket';
import { publishMqtt, topics } from '../mqtt/broker';

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

  // Pub/Sub MQTT: mismo tópico de chat que los DMs (namespace hazmeel2/chats)
  // más la bandeja personal de cada participante para apps nativas.
  const mqttPayload = {
    type: 'message',
    kind: 'chat',
    chatId: applicationId,
    message: payload,
    at: new Date().toISOString(),
  };
  publishMqtt(topics.messages(applicationId), mqttPayload);
  publishMqtt(topics.inbox(application.applicantId), mqttPayload);
  publishMqtt(topics.inbox(application.job.publisherId), mqttPayload);

  return payload;
};

export type ReceiptState = 'delivered' | 'read';

/** Recibos de entrega/lectura de los mensajes AJENOS de una postulación. */
export const updateReceipts = async (
  applicationId: string,
  userId: string,
  state: ReceiptState
): Promise<{ state: ReceiptState; updated: number }> => {
  const application = await findParticipantApplication(applicationId, userId);
  const otherUserId =
    application.applicantId === userId ? application.job.publisherId : application.applicantId;

  const pending = await prisma.chatMessage.findMany({
    where: {
      applicationId,
      senderId: { not: userId },
      ...(state === 'read'
        ? { OR: [{ deliveredAt: null }, { readAt: null }] }
        : { deliveredAt: null }),
    },
    select: { id: true },
  });

  if (!pending.length) {
    return { state, updated: 0 };
  }

  const now = new Date();
  await prisma.chatMessage.updateMany({
    where: { id: { in: pending.map((m) => m.id) } },
    data: state === 'read' ? { deliveredAt: now, readAt: now } : { deliveredAt: now },
  });

  const receipt = {
    type: 'receipt',
    kind: 'chat',
    chatId: applicationId,
    readerId: userId,
    state,
    messageIds: pending.map((m) => m.id),
    at: now.toISOString(),
  };
  publishMqtt(topics.receipts(applicationId), receipt);
  emitToUser(otherUserId, 'message_receipts', receipt);

  return { state, updated: pending.length };
};