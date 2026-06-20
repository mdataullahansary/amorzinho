'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Image as ImageIcon, Mic, Smile, Paperclip, Loader2, ChevronDown,
} from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { chatApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { cn, formatTime, getInitials, MOOD_EMOJIS } from '@/lib/utils';
import type { IMessage, IUser } from '@amorzinho/shared';

// ─── Reaction Picker ──────────────────────────────────────────────────────────
const QUICK_EMOJIS = ['❤️', '😂', '😮', '😢', '🔥', '👏'];

function ReactionPicker({ messageId, onClose }: { messageId: string; onClose: () => void }) {
  const socket = getSocket();
  return (
    <motion.div initial={{ opacity: 0, scale: 0.8, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="absolute bottom-full mb-2 left-0 glass rounded-2xl p-2 flex gap-1 z-10 shadow-glass">
      {QUICK_EMOJIS.map((emoji) => (
        <button key={emoji}
          id={`react-${emoji}`}
          onClick={() => { socket.emit('chat:react', { messageId, emoji }); onClose(); }}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-2 transition-all text-lg hover:scale-125">
          {emoji}
        </button>
      ))}
    </motion.div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({ message, isOwn }: { message: IMessage; isOwn: boolean }) {
  const [showReactions, setShowReactions] = useState(false);
  const sender = typeof message.senderId === 'object' ? message.senderId as IUser : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-2 group', isOwn ? 'flex-row-reverse' : 'flex-row')}
    >
      {/* Avatar */}
      {!isOwn && (
        <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold mt-auto"
          style={{ background: 'hsl(var(--accent-2) / 0.3)', color: 'hsl(var(--accent))' }}>
          {sender ? getInitials(sender.name) : '?'}
        </div>
      )}

      <div className={cn('flex flex-col gap-1 max-w-[72%]', isOwn ? 'items-end' : 'items-start')}>
        {/* Bubble */}
        <div className="relative">
          <div className={cn(
            'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
            isOwn
              ? 'rounded-tr-sm text-white'
              : 'glass rounded-tl-sm text-foreground',
          )} style={isOwn ? {
            background: 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent-2)))',
          } : {}}>
            {message.type === 'text' && <p>{message.content}</p>}
            {message.type === 'image' && message.fileUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={message.fileUrl} alt="Shared image"
                className="max-w-xs rounded-xl" />
            )}
            {message.type === 'voice' && (
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4" />
                <audio src={message.fileUrl} controls className="h-6 w-32" />
              </div>
            )}
          </div>

          {/* Hover actions */}
          <div className={cn(
            'absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1',
            isOwn ? 'right-full mr-2' : 'left-full ml-2'
          )}>
            <button onClick={() => setShowReactions(!showReactions)}
              className="w-6 h-6 rounded-full glass flex items-center justify-center text-xs hover:bg-surface-2">
              <Smile className="w-3 h-3" />
            </button>
          </div>

          {/* Reaction picker */}
          <AnimatePresence>
            {showReactions && (
              <ReactionPicker
                messageId={message._id}
                onClose={() => setShowReactions(false)}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Reactions */}
        {message.reactions.length > 0 && (
          <div className="flex gap-0.5 flex-wrap">
            {message.reactions.map((r, i) => (
              <span key={i} className="glass text-xs rounded-full px-2 py-0.5">
                {r.emoji}
              </span>
            ))}
          </div>
        )}

        {/* Time + read */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-fg">{formatTime(message.createdAt)}</span>
          {isOwn && message.readAt && (
            <span className="text-xs" style={{ color: 'hsl(var(--accent))' }}>✓✓</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Chat Page ────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const { user, couple } = useAuthStore();
  const { messages, isPartnerTyping, isPartnerOnline, hasMore, page, setMessages, prependMessages, setHasMore, incrementPage } = useChatStore();
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingOlder, setIsFetchingOlder] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const socket = getSocket();
  const coupleId = couple?._id;

  // Initial message load
  useEffect(() => {
    if (!coupleId) return;
    setIsLoading(true);
    chatApi.getMessages(1).then(({ data }) => {
      setMessages(data.data);
      setHasMore(data.hasMore);
    }).finally(() => {
      setIsLoading(false);
      endRef.current?.scrollIntoView({ behavior: 'instant' });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupleId]);

  // Auto-scroll on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const loadOlder = useCallback(async () => {
    if (!coupleId || !hasMore || isFetchingOlder) return;
    setIsFetchingOlder(true);
    const nextPage = page + 1;
    const { data } = await chatApi.getMessages(nextPage);
    prependMessages(data.data);
    setHasMore(data.hasMore);
    incrementPage();
    setIsFetchingOlder(false);
  }, [coupleId, hasMore, isFetchingOlder, page, prependMessages, setHasMore, incrementPage]);

  const handleTyping = () => {
    if (!coupleId) return;
    socket.emit('chat:typing', { coupleId, isTyping: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('chat:typing', { coupleId, isTyping: false });
    }, 2000);
  };

  const sendMessage = () => {
    if (!text.trim() || !coupleId) return;
    socket.emit('chat:send', { coupleId, content: text.trim(), type: 'text' });
    setText('');
    socket.emit('chat:typing', { coupleId, isTyping: false });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !coupleId) return;
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await chatApi.uploadImage(formData);
    socket.emit('chat:send', { coupleId, type: 'image', fileUrl: data.url });
  };

  const partnerUser = couple
    ? (typeof couple.user1 === 'object'
        ? (couple.user1 as IUser)._id === user?._id
          ? couple.user2 as IUser
          : couple.user1 as IUser
        : null)
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="glass border-b border-border px-6 py-4 flex items-center gap-3 shrink-0">
        {partnerUser ? (
          <>
            <div className="relative">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: 'hsl(var(--accent-2) / 0.3)', color: 'hsl(var(--accent))' }}>
                {getInitials((partnerUser as IUser).name)}
              </div>
              <div className={cn('online-dot', !isPartnerOnline && 'bg-muted opacity-50')} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{(partnerUser as IUser).name}</p>
              <p className="text-xs text-muted-fg">
                {isPartnerOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-fg">Waiting for your partner to join…</p>
        )}
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 relative"
        onScroll={(e) => {
          const el = e.currentTarget;
          if (el.scrollTop < 100) loadOlder();
          setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
        }}
      >
        {isFetchingOlder && (
          <div className="flex justify-center py-2">
            <Loader2 className="w-4 h-4 animate-spin text-muted-fg" />
          </div>
        )}
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-muted-fg" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-fg">
            <div className="text-4xl">💌</div>
            <p className="text-sm">Send the first message</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg._id}
              message={msg}
              isOwn={typeof msg.senderId === 'object'
                ? (msg.senderId as IUser)._id === user?._id
                : msg.senderId === user?._id}
            />
          ))
        )}

        {/* Typing indicator */}
        <AnimatePresence>
          {isPartnerTyping && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex gap-2 items-end">
              <div className="glass rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5">
                {[0, 0.2, 0.4].map((d, i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: 'hsl(var(--muted))', animationDelay: `${d}s` }} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={endRef} />
      </div>

      {/* Scroll to bottom */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            onClick={() => endRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="absolute bottom-24 right-6 glass rounded-full p-2">
            <ChevronDown className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="glass border-t border-border px-4 py-3 shrink-0">
        <div className="flex items-end gap-2">
          <div className="flex gap-1">
            <label id="chat-image-upload" htmlFor="chat-img-input" className="btn-ghost p-2 rounded-xl cursor-pointer">
              <ImageIcon className="w-4 h-4" />
            </label>
            <input id="chat-img-input" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            <button id="chat-attach" className="btn-ghost p-2 rounded-xl">
              <Paperclip className="w-4 h-4" />
            </button>
          </div>

          <textarea
            ref={inputRef}
            id="chat-input"
            value={text}
            onChange={(e) => { setText(e.target.value); handleTyping(); }}
            onKeyDown={handleKeyDown}
            placeholder="Say something sweet…"
            rows={1}
            className="input-base flex-1 resize-none max-h-32 overflow-y-auto"
            style={{ height: 'auto' }}
          />

          <button
            id="chat-send"
            onClick={sendMessage}
            disabled={!text.trim()}
            className="btn-primary p-2.5 rounded-xl disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
