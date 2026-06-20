'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, Loader2 } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  BarChart, Bar, Cell, PieChart, Pie, Sector,
} from 'recharts';
import { analyticsApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { MOOD_EMOJIS, MOOD_COLORS, cn } from '@/lib/utils';
import type { ICoupleAnalytics } from '@amorzinho/shared';

// ─── Stat Tile ─────────────────────────────────────────────────────────────────
function Tile({ label, value, emoji, delay = 0 }:
  { label: string; value: number | string; emoji: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-hover rounded-2xl p-5 flex flex-col gap-2"
    >
      <span className="text-3xl">{emoji}</span>
      <div className="text-2xl font-bold font-serif gradient-text">{value}</div>
      <p className="text-xs text-muted-fg">{label}</p>
    </motion.div>
  );
}

// ─── Custom Tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-3 py-2 text-xs">
      <p className="text-muted-fg mb-0.5">{label}</p>
      <p className="text-foreground font-medium">{payload[0].value} messages</p>
    </div>
  );
}

// ─── Analytics Page ────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const { couple } = useAuthStore();
  const [data, setData] = useState<ICoupleAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    analyticsApi.get()
      .then(({ data: d }) => setData(d))
      .catch(() => null)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="page-container flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-fg" />
      </div>
    );
  }

  if (!data) return null;

  const ACCENT = 'hsl(var(--accent))';
  const ACCENT2 = 'hsl(var(--accent-2))';

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="section-title">Analytics 📊</h1>
        <p className="section-subtitle">Your story, in numbers</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Tile label="Days together" value={data.daysTogether} emoji="💕" delay={0} />
        <Tile label="Messages exchanged" value={data.messagesExchanged.toLocaleString()} emoji="💬" delay={0.05} />
        <Tile label="Memories created" value={data.memoriesCreated} emoji="📸" delay={0.1} />
        <Tile label="Movies watched" value={data.moviesWatched} emoji="🎬" delay={0.15} />
        <Tile label="Diary entries" value={data.diaryEntries} emoji="📖" delay={0.2} />
        <Tile label="Bucket completed" value={`${data.bucketCompleted}/${data.bucketTotal}`} emoji="✅" delay={0.25} />
      </div>

      {/* Messages chart */}
      {data.messagesByDay.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-medium text-foreground mb-4">Messages — last 30 days</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.messagesByDay}>
              <defs>
                <linearGradient id="msgGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ACCENT} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(230 8% 40%)' }} tickLine={false} axisLine={false}
                tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(230 8% 40%)' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke={ACCENT} strokeWidth={2} fill="url(#msgGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Mood chart */}
      {data.topMoods.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-6">
          <h2 className="text-sm font-medium text-foreground mb-4">Your most felt moods</h2>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={data.topMoods} dataKey="count" nameKey="mood" cx="50%" cy="50%"
                  innerRadius={50} outerRadius={75} strokeWidth={0}>
                  {data.topMoods.map((entry, i) => (
                    <Cell key={i} fill={MOOD_COLORS[entry.mood] || ACCENT} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {data.topMoods.map((entry, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: MOOD_COLORS[entry.mood] || ACCENT }} />
                  <span className="text-sm text-foreground">{MOOD_EMOJIS[entry.mood]} {entry.mood.replace('-', ' ')}</span>
                  <span className="ml-auto text-xs text-muted-fg">{entry.count}x</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
