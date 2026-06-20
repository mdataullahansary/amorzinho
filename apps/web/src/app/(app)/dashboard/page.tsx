'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Music, MessageCircle, Calendar, BookOpen, Smile } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useMusicStore } from '@/store/musicStore';
import { analyticsApi, coupleApi } from '@/lib/api';
import {
  cn, daysTogether, daysUntilAnniversary, formatRelative,
  MOOD_EMOJIS, MOOD_COLORS,
} from '@/lib/utils';
import type { ICoupleAnalytics, IUser, Mood } from '@amorzinho/shared';

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, delay = 0 }:
  { icon: React.ElementType; label: string; value: string | number; color: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="glass-hover rounded-2xl p-5 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 -translate-y-6 translate-x-6"
        style={{ background: color }} />
      <div className="relative z-10">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
          style={{ background: `${color}1a` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <div className="text-2xl font-bold font-serif text-foreground">{value}</div>
        <div className="text-xs text-muted-fg mt-0.5">{label}</div>
      </div>
    </motion.div>
  );
}

// ─── Mood Widget ──────────────────────────────────────────────────────────────
const MOODS: Mood[] = ['happy', 'in-love', 'romantic', 'excited', 'grateful', 'tired', 'sad', 'anxious'];

function MoodSelector() {
  const { user, couple, setMood } = useAuthStore();
  const [open, setOpen] = useState(false);

  const isUser1 = couple?.user1 && typeof couple.user1 === 'object'
    ? (couple.user1 as IUser)._id === user?._id
    : couple?.user1 === user?._id;

  const myMood = isUser1 ? couple?.currentMood?.user1 : couple?.currentMood?.user2;
  const partnerMood = isUser1 ? couple?.currentMood?.user2 : couple?.currentMood?.user1;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      className="glass rounded-2xl p-5 col-span-1 md:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Smile className="w-4 h-4" style={{ color: 'hsl(var(--accent))' }} />
          <h3 className="text-sm font-medium text-foreground">How are you feeling?</h3>
        </div>
      </div>
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-fg">You</span>
          <span className="text-2xl">{myMood ? MOOD_EMOJIS[myMood] : '–'}</span>
        </div>
        <Heart className="w-3 h-3" style={{ color: 'hsl(var(--accent))' }} />
        <div className="flex items-center gap-2">
          <span className="text-2xl">{partnerMood ? MOOD_EMOJIS[partnerMood] : '–'}</span>
          <span className="text-xs text-muted-fg">Partner</span>
        </div>
      </div>
      <button
        id="mood-toggle"
        onClick={() => setOpen(!open)}
        className="btn-glass text-xs w-full"
      >
        Update your mood
      </button>
      {open && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="grid grid-cols-4 gap-2 mt-3 overflow-hidden">
          {MOODS.map((mood) => (
            <button
              key={mood}
              id={`mood-${mood}`}
              onClick={() => { setMood(mood); setOpen(false); }}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-xl transition-all hover:scale-105',
                myMood === mood ? 'bg-surface-2 ring-1' : 'hover:bg-surface-2'
              )}
              style={myMood === mood ? { outline: `1px solid ${MOOD_COLORS[mood]}` } : {}}
            >
              <span className="text-xl">{MOOD_EMOJIS[mood]}</span>
              <span className="text-xs text-muted-fg capitalize">{mood.replace('-', ' ')}</span>
            </button>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── Daily Note Quick Widget ──────────────────────────────────────────────────
function DailyNoteWidget() {
  const { couple } = useAuthStore();
  const [note, setNote] = useState(couple?.dailyNote || '');
  const [isSaving, setIsSaving] = useState(false);

  // Sync state if couple updates from socket or another tab
  useEffect(() => {
    if (couple?.dailyNote !== undefined && couple.dailyNote !== note) {
      setNote(couple.dailyNote);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couple?.dailyNote]);

  const handleSave = async () => {
    if (note === couple?.dailyNote) return;
    setIsSaving(true);
    try {
      await coupleApi.setNote(note);
      useAuthStore.getState().setCouple({ ...couple!, dailyNote: note });
    } catch (err) {
      console.error('Failed to save note', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
      className="glass rounded-2xl p-5 col-span-1 md:col-span-2 relative">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="w-4 h-4" style={{ color: 'hsl(var(--accent-2))' }} />
        <h3 className="text-sm font-medium text-foreground">Today&apos;s note</h3>
        {isSaving && <span className="text-xs text-muted-fg ml-auto animate-pulse">Saving...</span>}
      </div>
      <textarea
        id="daily-note-input"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={handleSave}
        placeholder="What's on your heart today?"
        rows={3}
        className="input-base resize-none text-sm bg-transparent"
      />
    </motion.div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { couple } = useAuthStore();
  const { messages } = useChatStore();
  const { currentTrack, isPlaying } = useMusicStore();
  const [analytics, setAnalytics] = useState<ICoupleAnalytics | null>(null);

  useEffect(() => {
    analyticsApi.get().then(({ data }) => setAnalytics(data)).catch(() => null);
  }, []);

  const daysTogetherCount = couple
    ? daysTogether(couple.createdAt)
    : 0;

  const anniversaryDays = couple?.anniversaryDate
    ? daysUntilAnniversary(couple.anniversaryDate)
    : null;

  const lastMessage = messages[messages.length - 1];

  const ACCENT = 'hsl(var(--accent))';
  const ACCENT2 = 'hsl(var(--accent-2))';

  return (
    <div className="page-container">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
        <h1 className="font-serif text-4xl text-foreground mb-1">
          Your space 💕
        </h1>
        <p className="text-muted-fg text-sm">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Heart}
          label="Days together"
          value={daysTogetherCount}
          color={ACCENT}
          delay={0}
        />
        <StatCard
          icon={MessageCircle}
          label="Messages"
          value={analytics?.messagesExchanged ?? '—'}
          color={ACCENT2}
          delay={0.05}
        />
        <StatCard
          icon={Music}
          label="Songs listened"
          value={analytics?.songsListened ?? '—'}
          color={ACCENT}
          delay={0.1}
        />
        <StatCard
          icon={Calendar}
          label="Days until anniversary"
          value={anniversaryDays ?? '—'}
          color={ACCENT2}
          delay={0.15}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        {/* Mood Widget — spans 2 cols */}
        <MoodSelector />

        {/* Now Playing */}
        {currentTrack && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="glass rounded-2xl p-5 col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <Music className="w-4 h-4" style={{ color: 'hsl(var(--accent))' }} />
              <h3 className="text-sm font-medium text-foreground">Now playing</h3>
              {isPlaying && (
                <div className="ml-auto flex items-end gap-0.5 h-4">
                  {[1,2,3].map((i) => (
                    <div key={i} className="waveform-bar w-1"
                      style={{ height: `${[60,100,70][i-1]}%`, animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              {currentTrack.albumArtUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentTrack.albumArtUrl} alt={currentTrack.title}
                  className="w-12 h-12 rounded-xl object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'hsl(var(--accent) / 0.15)' }}>
                  <Music className="w-5 h-5" style={{ color: 'hsl(var(--accent))' }} />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{currentTrack.title}</p>
                <p className="text-xs text-muted-fg truncate">{currentTrack.artist || 'Unknown artist'}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Chat preview */}
        {lastMessage && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-2xl p-5 col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-4 h-4" style={{ color: 'hsl(var(--accent-2))' }} />
              <h3 className="text-sm font-medium text-foreground">Last message</h3>
              <span className="ml-auto text-xs text-muted-fg">
                {formatRelative(lastMessage.createdAt)}
              </span>
            </div>
            <p className="text-sm text-muted-fg line-clamp-2">
              {lastMessage.type === 'text' ? lastMessage.content : `Sent a ${lastMessage.type}`}
            </p>
          </motion.div>
        )}

        {/* Daily note */}
        <DailyNoteWidget />
      </div>
    </div>
  );
}
