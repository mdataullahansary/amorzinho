import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { registerChatHandlers } from './chatHandler';
import { registerMusicHandlers } from './musicHandler';
import { registerMovieHandlers } from './movieHandler';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  coupleId?: string;
}

export function initSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // ─── Auth Middleware ─────────────────────────────────────────────────────────
  io.use(async (socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) return next(new Error('Authentication error: no token'));

    try {
      const decoded = jwt.verify(token as string, process.env.JWT_SECRET!) as { id: string };
      const user = await User.findById(decoded.id).select('coupleId isOnline');

      if (!user) return next(new Error('Authentication error: user not found'));

      socket.userId = user._id.toString();
      socket.coupleId = user.coupleId?.toString();
      next();
    } catch {
      next(new Error('Authentication error: invalid token'));
    }
  });

  // ─── Connection ──────────────────────────────────────────────────────────────
  io.on('connection', async (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    const coupleId = socket.coupleId;

    console.log(`🔌 Socket connected: ${userId}`);

    // Join couple room
    if (coupleId) {
      await socket.join(`couple:${coupleId}`);
    }

    // Mark user as online
    await User.findByIdAndUpdate(userId, { isOnline: true });
    if (coupleId) {
      socket.to(`couple:${coupleId}`).emit('presence:online', { userId });
    }

    // Register feature handlers
    registerChatHandlers(io, socket as AuthenticatedSocket & { userId: string; coupleId?: string });
    registerMusicHandlers(io, socket as AuthenticatedSocket & { userId: string; coupleId?: string });
    registerMovieHandlers(io, socket as AuthenticatedSocket & { userId: string; coupleId?: string });

    // ─── Disconnect ────────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`🔌 Socket disconnected: ${userId}`);
      const lastSeen = new Date();
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen });
      if (coupleId) {
        socket.to(`couple:${coupleId}`).emit('presence:offline', { userId, lastSeen });
      }
    });
  });

  return io;
}
