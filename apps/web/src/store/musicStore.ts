import { create } from 'zustand';
import type { IUploadedTrack, TrackType } from '@amorzinho/shared';
import { getSocket } from '@/lib/socket';

interface MusicState {
  // Playback state
  currentTrack: IUploadedTrack | null;
  currentTrackType: TrackType;
  spotifyTrackId: string | null;
  isPlaying: boolean;
  position: number; // seconds
  duration: number;
  volume: number;

  // Queue
  queue: IUploadedTrack[];

  // Session
  sessionId: string | null;

  // Actions
  setTrack: (track: IUploadedTrack) => void;
  setSpotifyTrack: (trackId: string) => void;
  play: (position?: number) => void;
  pause: () => void;
  seek: (position: number) => void;
  setVolume: (volume: number) => void;
  setPosition: (position: number) => void;
  setDuration: (duration: number) => void;
  addToQueue: (track: IUploadedTrack) => void;
  removeFromQueue: (trackId: string) => void;
  setQueue: (queue: IUploadedTrack[]) => void;
  setSession: (sessionId: string) => void;

  // Receive sync from partner
  applyState: (state: Partial<MusicState>) => void;
}

export const useMusicStore = create<MusicState>((set, get) => ({
  currentTrack: null,
  currentTrackType: 'uploaded',
  spotifyTrackId: null,
  isPlaying: false,
  position: 0,
  duration: 0,
  volume: 80,
  queue: [],
  sessionId: null,

  setTrack: (track) => {
    set({ currentTrack: track, currentTrackType: 'uploaded', isPlaying: false, position: 0 });
  },

  setSpotifyTrack: (trackId) => {
    set({ spotifyTrackId: trackId, currentTrackType: 'spotify' });
  },

  play: (position) => {
    const { currentTrack, sessionId } = get();
    if (!currentTrack) return;
    const pos = position ?? get().position;
    set({ isPlaying: true, position: pos });

    const socket = getSocket();
    socket.emit('music:play', {
      sessionId,
      trackId: currentTrack._id,
      trackType: 'uploaded',
      position: pos,
      volume: get().volume,
    });
  },

  pause: () => {
    const { position, sessionId } = get();
    set({ isPlaying: false });
    const socket = getSocket();
    socket.emit('music:pause', { sessionId, position, isPlaying: false });
  },

  seek: (position) => {
    const { isPlaying, sessionId } = get();
    set({ position });
    const socket = getSocket();
    socket.emit('music:seek', { sessionId, position, isPlaying });
  },

  setVolume: (volume) => {
    set({ volume });
    const socket = getSocket();
    socket.emit('music:volume', { volume });
  },

  setPosition: (position) => set({ position }),
  setDuration: (duration) => set({ duration }),

  addToQueue: (track) => {
    set((state) => {
      if (state.queue.some((t) => t._id === track._id)) return state;
      return { queue: [...state.queue, track] };
    });
    const socket = getSocket();
    socket.emit('music:queue-add', {
      sessionId: get().sessionId,
      trackId: track._id,
      trackType: 'uploaded',
    });
  },

  removeFromQueue: (trackId) =>
    set((state) => ({ queue: state.queue.filter((t) => t._id !== trackId) })),

  setQueue: (queue) => set({ queue }),
  setSession: (sessionId) => set({ sessionId }),

  applyState: (state) => set((prev) => ({ ...prev, ...state })),
}));
