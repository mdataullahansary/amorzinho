import { Server, Socket } from 'socket.io';
import { ListeningSession } from '../models/Music';
import { UploadedTrack } from '../models/Music';
import type { MusicStatePayload, MusicQueuePayload } from '@amorzinho/shared';

type AuthSocket = Socket & { userId: string; coupleId?: string };

export function registerMusicHandlers(io: Server, socket: AuthSocket): void {
  const coupleId = socket.coupleId;
  if (!coupleId) return;

  const room = `couple:${coupleId}`;

  // ─── Play ──────────────────────────────────────────────────────────────────
  socket.on('music:play', async (payload: MusicStatePayload) => {
    try {
      await ListeningSession.findOneAndUpdate(
        { coupleId },
        {
          trackId: payload.trackId,
          trackType: payload.trackType || 'uploaded',
          isPlaying: true,
          position: payload.position,
        },
        { upsert: true, new: true }
      );

      // Increment play count for uploaded tracks
      if (payload.trackType === 'uploaded' && payload.trackId) {
        await UploadedTrack.findByIdAndUpdate(payload.trackId, { $inc: { playCount: 1 } });
      }

      socket.to(room).emit('music:state', {
        isPlaying: true,
        position: payload.position,
        trackId: payload.trackId,
        trackType: payload.trackType,
        volume: payload.volume,
      });
    } catch (err) {
      console.error('[music:play]', err);
    }
  });

  // ─── Pause ─────────────────────────────────────────────────────────────────
  socket.on('music:pause', async (payload: MusicStatePayload) => {
    try {
      await ListeningSession.findOneAndUpdate(
        { coupleId },
        { isPlaying: false, position: payload.position },
        { upsert: true }
      );

      socket.to(room).emit('music:state', {
        isPlaying: false,
        position: payload.position,
      });
    } catch (err) {
      console.error('[music:pause]', err);
    }
  });

  // ─── Seek ──────────────────────────────────────────────────────────────────
  socket.on('music:seek', async (payload: MusicStatePayload) => {
    try {
      await ListeningSession.findOneAndUpdate(
        { coupleId },
        { position: payload.position },
        { upsert: true }
      );

      socket.to(room).emit('music:state', {
        isPlaying: payload.isPlaying,
        position: payload.position,
      });
    } catch (err) {
      console.error('[music:seek]', err);
    }
  });

  // ─── Volume ────────────────────────────────────────────────────────────────
  socket.on('music:volume', (payload: { volume: number }) => {
    socket.to(room).emit('music:state', { volume: payload.volume });
  });

  // ─── Queue Add ────────────────────────────────────────────────────────────
  socket.on('music:queue-add', async (payload: MusicQueuePayload) => {
    // Notify partner that a song was added to queue
    socket.to(room).emit('music:queue', {
      action: 'add',
      trackId: payload.trackId,
      trackType: payload.trackType,
    });
  });

  // ─── Request Sync (new joiner asks for current state) ────────────────────
  socket.on('music:request-sync', async () => {
    const session = await ListeningSession.findOne({ coupleId });
    if (session) {
      socket.emit('music:state', {
        isPlaying: session.isPlaying,
        position: session.position,
        trackId: session.trackId,
        volume: session.volume,
      });
    }
  });
}
