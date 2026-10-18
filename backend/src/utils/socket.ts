import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken } from './jwt';
import { AppError } from './AppError';
import { TokenPayload } from './jwt';
import { isAllowedOrigin } from './corsOrigin';

let io: Server;

export interface AuthSocket extends Socket {
  userId?: string;
}

export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      // Mismo criterio que Express: lista configurada + localhost + túneles.
      origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
      credentials: true,
    },
  });

  io.use((socket: AuthSocket, next) => {
    try {
      const auth = socket.handshake.auth as { token?: string };
      const token = auth?.token;

      if (!token) {
        return next(new AppError('Token de autenticación requerido', 401));
      }

      const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
      const payload: TokenPayload = verifyToken(cleanToken);

      if (!payload.sub) {
        return next(new AppError('Token inválido', 401));
      }

      socket.userId = payload.sub;
      next();
    } catch (err) {
      next(new AppError('Token de autenticación inválido', 401));
    }
  });

  io.on('connection', (socket: AuthSocket) => {
    if (socket.userId) {
      socket.join(`user_${socket.userId}`);
    }

    socket.on('disconnect', () => {
      if (socket.userId) {
        socket.leave(`user_${socket.userId}`);
      }
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new AppError('Socket.io no inicializado', 500);
  }
  return io;
};

export const emitToUser = (userId: string, event: string, data: any): void => {
  try {
    const socketIo = getIO();
    socketIo.to(`user_${userId}`).emit(event, data);
  } catch (err) {
    console.error(`[Socket] Error al emitir a user_${userId}:`, (err as Error).message);
  }
};
