import { create } from 'zustand';
import { getSocket } from '@/lib/socket';

interface MovieState {
  sessionId: string | null;
  videoUrl: string | null;
  title: string | null;
  isPlaying: boolean;
  currentTime: number;

  setSession: (id: string, videoUrl: string, title?: string) => void;
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  applyState: (state: { isPlaying?: boolean; currentTime?: number }) => void;
  endSession: () => void;
}

export const useMovieStore = create<MovieState>((set, get) => ({
  sessionId: null,
  videoUrl: null,
  title: null,
  isPlaying: false,
  currentTime: 0,

  setSession: (id, videoUrl, title) =>
    set({ sessionId: id, videoUrl, title, isPlaying: false, currentTime: 0 }),

  play: () => {
    const { sessionId, currentTime } = get();
    set({ isPlaying: true });
    getSocket().emit('movie:play', { sessionId, currentTime, isPlaying: true });
  },

  pause: () => {
    const { sessionId, currentTime } = get();
    set({ isPlaying: false });
    getSocket().emit('movie:pause', { sessionId, currentTime, isPlaying: false });
  },

  seek: (time) => {
    const { sessionId, isPlaying } = get();
    set({ currentTime: time });
    getSocket().emit('movie:seek', { sessionId, currentTime: time, isPlaying });
  },

  applyState: (state) => set((prev) => ({ ...prev, ...state })),
  endSession: () => set({ sessionId: null, videoUrl: null, title: null, isPlaying: false, currentTime: 0 }),
}));
