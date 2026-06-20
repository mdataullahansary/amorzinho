'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import AppSidebar from '@/components/shared/AppSidebar';
import MusicPlayer from '@/components/music/MusicPlayer';
import { Loader2 } from 'lucide-react';
import { connectSocket, getSocket } from '@/lib/socket';
import { useChatStore } from '@/store/chatStore';
import { useMusicStore } from '@/store/musicStore';
import { useMovieStore } from '@/store/movieStore';
import type { IMessage } from '@amorzinho/shared';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, token, refreshUser } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  const { addMessage, updateReactions, markRead, setTyping, setOnline } = useChatStore();
  const { applyState: applyMusicState } = useMusicStore();
  const { applyState: applyMovieState } = useMovieStore();

  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.push('/login');
      return;
    }

    // Restore user + couple from server
    refreshUser().finally(() => setIsReady(true));

    // Connect socket and wire up events
    connectSocket();
    const socket = getSocket();

    socket.on('chat:receive', ({ message }: { message: IMessage }) => {
      addMessage(message);
    });
    socket.on('chat:typing', ({ isTyping }: { isTyping: boolean }) => {
      setTyping(isTyping);
    });
    socket.on('chat:reaction', ({ messageId, reactions }: { messageId: string; reactions: IMessage['reactions'] }) => {
      updateReactions(messageId, reactions);
    });
    socket.on('chat:read-receipt', ({ messageId, readAt }: { messageId: string; readAt: string }) => {
      markRead(messageId, readAt);
    });
    socket.on('music:state', (state: Parameters<typeof applyMusicState>[0]) => {
      applyMusicState(state);
    });
    socket.on('movie:state', (state: Parameters<typeof applyMovieState>[0]) => {
      applyMovieState(state);
    });
    socket.on('presence:online', () => setOnline(true));
    socket.on('presence:offline', () => setOnline(false));

    return () => {
      socket.off('chat:receive');
      socket.off('chat:typing');
      socket.off('chat:reaction');
      socket.off('chat:read-receipt');
      socket.off('music:state');
      socket.off('movie:state');
      socket.off('presence:online');
      socket.off('presence:offline');
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-fg" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
        {children}
        <div className="h-24" /> {/* spacer for persistent music player */}
      </main>
      <MusicPlayer />
    </div>
  );
}
