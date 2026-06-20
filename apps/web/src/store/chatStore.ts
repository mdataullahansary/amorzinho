import { create } from 'zustand';
import type { IMessage } from '@amorzinho/shared';

interface ChatState {
  messages: IMessage[];
  isPartnerTyping: boolean;
  isPartnerOnline: boolean;
  hasMore: boolean;
  page: number;
  isLoading: boolean;

  setMessages: (messages: IMessage[]) => void;
  prependMessages: (messages: IMessage[]) => void; // for pagination (load older)
  addMessage: (message: IMessage) => void;
  updateReactions: (messageId: string, reactions: IMessage['reactions']) => void;
  markRead: (messageId: string, readAt: string) => void;
  setTyping: (isTyping: boolean) => void;
  setOnline: (isOnline: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  incrementPage: () => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isPartnerTyping: false,
  isPartnerOnline: false,
  hasMore: true,
  page: 1,
  isLoading: false,

  setMessages: (messages) => set({ messages }),

  prependMessages: (newMessages) =>
    set((state) => {
      const existingIds = new Set(state.messages.map((m) => m._id));
      const filtered = newMessages.filter((m) => !existingIds.has(m._id));
      return { messages: [...filtered, ...state.messages] };
    }),

  addMessage: (message) =>
    set((state) => {
      if (state.messages.some((m) => m._id === message._id)) return state;
      return { messages: [...state.messages, message] };
    }),

  updateReactions: (messageId, reactions) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m._id === messageId ? { ...m, reactions } : m
      ),
    })),

  markRead: (messageId, readAt) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m._id === messageId ? { ...m, readAt } : m
      ),
    })),

  setTyping: (isTyping) => set({ isPartnerTyping: isTyping }),
  setOnline: (isOnline) => set({ isPartnerOnline: isOnline }),
  setHasMore: (hasMore) => set({ hasMore }),
  incrementPage: () => set((state) => ({ page: state.page + 1 })),
  reset: () => set({ messages: [], page: 1, hasMore: true }),
}));
