import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { IUser, ICouple } from '@amorzinho/shared';
import { authApi, coupleApi } from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';

interface AuthState {
  user: IUser | null;
  couple: ICouple | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  setToken: (token: string) => Promise<void>; // for OAuth callback
  logout: () => void;
  setCouple: (couple: ICouple) => void;
  setMood: (mood: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      couple: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await authApi.login({ email, password });
          localStorage.setItem('amorzinho_token', data.token);
          set({ token: data.token, user: data.user, isAuthenticated: true });
          // Fetch couple data
          const meRes = await authApi.me();
          set({ couple: meRes.data.couple, user: meRes.data.user });
          connectSocket();
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await authApi.register({ name, email, password });
          localStorage.setItem('amorzinho_token', data.token);
          set({ token: data.token, user: data.user, isAuthenticated: true });
          connectSocket();
        } finally {
          set({ isLoading: false });
        }
      },

      setToken: async (token) => {
        localStorage.setItem('amorzinho_token', token);
        set({ token, isAuthenticated: true });
        const { data } = await authApi.me();
        set({ user: data.user, couple: data.couple });
        connectSocket();
      },

      logout: () => {
        localStorage.removeItem('amorzinho_token');
        disconnectSocket();
        set({ user: null, couple: null, token: null, isAuthenticated: false });
      },

      setCouple: (couple) => set({ couple }),

      setMood: async (mood) => {
        await coupleApi.setMood(mood);
        const { couple, user } = get();
        if (couple && user) {
          const isUser1 = couple.user1 && typeof couple.user1 === 'object'
            ? (couple.user1 as IUser)._id === user._id
            : couple.user1 === user._id;

          set({
            couple: {
              ...couple,
              currentMood: {
                ...couple.currentMood,
                ...(isUser1 ? { user1: mood as ICouple['currentMood']['user1'] } : { user2: mood as ICouple['currentMood']['user2'] }),
              },
            },
          });
        }
      },

      refreshUser: async () => {
        const { data } = await authApi.me();
        set({ user: data.user, couple: data.couple });
      },
    }),
    {
      name: 'amorzinho-auth',
      partialize: (state) => ({ token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);
