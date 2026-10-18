import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { normalizeMessageContent } from '../utils/chatMessage';
import { emitToUser } from '../utils/socket';

const USER_SELECT = {
  id: true,
  fullName: true,
  companyName: true,
} satisfies Prisma.UserSelect;

/**
 * Normaliza el par de participantes (A < B) para que exista un único hilo
 * entre dos usuarios sea cual sea el orden en que se haya creado.
 */
const normalizePair = (a: string, b: string): [string, string] => (a < b ? [a, b] : [b, a]);

const findParticipantConversation = async (conversationId: string, userId: string) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new AppError('Conversación no encontrada', 404);
  }
  if (conversation.userAId !== userId && conversation.userBId !== userId) {
    throw new AppError('No tienes permiso para acceder a esta conversación', 403);
  }

  return conversation;
};

/** Abre (o devuelve el existente) el hilo directo con `otherUserId`. */
export const startOrGetConversation = async (userId: string, otherUserId: string) => {
  if (userId === otherUserId) {
    throw new AppError('No puedes iniciar un chat contigo mismo', 400);
  }

  const other = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: USER_SELECT,
  });
  if (!other) {
    throw new AppError('Usuario no encontrado', 404);
  }

  const [userAId, userBId] = normalizePair(userId, otherUserId);

  const conversation = await prisma.conversation.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    update: {},
    create: { userAId, userBId },
    include: {
      userA: { select: USER_SELECT },
      userB: { select: USER_SELECT },
    },
  });

  return {
    id: conversation.id,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    other: conversation.userAId === userId ? conversation.userB : conversation.userA,
  };
};

export const listConversations = async (userId: string) => {
  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    orderBy: { updatedAt: 'desc' },
    take: 50,
    include: {
      userA: { select: USER_SELECT },
      userB: { select: USER_SELECT },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  return conversations.map((conversation) => ({
    id: conversation.id,
    updatedAt: conversation.updatedAt,
    other: conversation.userAId === userId ? conversation.userB : conversation.userA,
    lastMessage: conversation.messages[0] ?? null,
  }));
};

export const listMessages = async (conversationId: string, userId: string) => {
  await findParticipantConversation(conversationId, userId);

  const messages = await prisma.directMessage.findMany({
    where: { conversationId },
    include: { sender: { select: USER_SELECT } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return messages.reverse();
};

export const sendMessage = async (conversationId: string, userId: string, content: string) => {
  const conversation = await findParticipantConversation(conversationId, userId);
  const otherUserId = conversation.userAId === userId ? conversation.userBId : conversation.userAId;

  const message = await prisma.directMessage.create({
    data: {
      conversationId,
      senderId: userId,
      content: normalizeMessageContent(content),
    },
    include: { sender: { select: USER_SELECT } },
  });

  // Ordenamos los hilos por última actividad.
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  const payload = { ...message, conversationId };

  emitToUser(userId, 'direct_message', payload);
  emitToUser(otherUserId, 'direct_message', payload);

  return payload;
};
