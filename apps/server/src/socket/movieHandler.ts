import { Server, Socket } from 'socket.io';
import { MovieSession } from '../models/MovieSession';
import type { MovieStatePayload } from '@amorzinho/shared';

type AuthSocket = Socket & { userId: string; coupleId?: string };

export function registerMovieHandlers(io: Server, socket: AuthSocket): void {
  const coupleId = socket.coupleId;
  if (!coupleId) return;

  const room = `couple:${coupleId}`;

  // ─── Play ──────────────────────────────────────────────────────────────────
  socket.on('movie:play', async (payload: MovieStatePayload) => {
    try {
      await MovieSession.findOneAndUpdate(
        { _id: payload.sessionId },
        { isPlaying: true, currentTime: payload.currentTime, lastSyncAt: new Date() }
      );
      socket.to(room).emit('movie:state', { isPlaying: true, currentTime: payload.currentTime });
    } catch (err) {
      console.error('[movie:play]', err);
    }
  });

  // ─── Pause ─────────────────────────────────────────────────────────────────
  socket.on('movie:pause', async (payload: MovieStatePayload) => {
    try {
      await MovieSession.findOneAndUpdate(
        { _id: payload.sessionId },
        { isPlaying: false, currentTime: payload.currentTime, lastSyncAt: new Date() }
      );
      socket.to(room).emit('movie:state', { isPlaying: false, currentTime: payload.currentTime });
    } catch (err) {
      console.error('[movie:pause]', err);
    }
  });

  // ─── Seek ──────────────────────────────────────────────────────────────────
  socket.on('movie:seek', async (payload: MovieStatePayload) => {
    try {
      await MovieSession.findOneAndUpdate(
        { _id: payload.sessionId },
        { currentTime: payload.currentTime, lastSyncAt: new Date() }
      );
      socket.to(room).emit('movie:state', { currentTime: payload.currentTime, isPlaying: payload.isPlaying });
    } catch (err) {
      console.error('[movie:seek]', err);
    }
  });

  // ─── Request Sync ─────────────────────────────────────────────────────────
  socket.on('movie:request-sync', async ({ sessionId }: { sessionId: string }) => {
    const session = await MovieSession.findById(sessionId);
    if (session) {
      socket.emit('movie:state', {
        isPlaying: session.isPlaying,
        currentTime: session.currentTime,
      });
    }
  });

  // ─── Reaction ─────────────────────────────────────────────────────────────
  socket.on('movie:react', (payload: { emoji: string }) => {
    socket.to(room).emit('movie:react', { userId: socket.userId, emoji: payload.emoji });
  });
}
