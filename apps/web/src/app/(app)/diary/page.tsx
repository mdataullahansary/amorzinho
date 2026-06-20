'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Plus, ChevronLeft, ChevronRight, Loader2, Smile } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { diaryApi } from '@/lib/api';
import { MOOD_EMOJIS, MOOD_COLORS, cn } from '@/lib/utils';
import type { IDiaryEntry, Mood } from '@amorzinho/shared';

const MOODS: Mood[] = ['happy', 'in-love', 'romantic', 'excited', 'grateful', 'tired', 'sad', 'anxious'];

// ─── Diary Editor ─────────────────────────────────────────────────────────────
function DiaryEditor({ entry, date, onSave, onClose }:
  { entry?: IDiaryEntry; date: Date; onSave: (e: IDiaryEntry) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    title: entry?.title || '',
    content: entry?.content || '',
    mood: entry?.mood || '' as Mood | '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!form.content.trim()) return;
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('date', format(date, 'yyyy-MM-dd'));
      formData.append('content', form.content);
      if (form.title) formData.append('title', form.title);
      if (form.mood) formData.append('mood', form.mood);

      const { data } = entry
        ? await diaryApi.updateEntry(entry._id, { title: form.title, content: form.content, mood: form.mood })
        : await diaryApi.createEntry(formData);
      onSave(data.entry);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="glass rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-serif text-xl text-foreground">
            {format(date, 'd MMMM yyyy')}
          </h2>
          <button onClick={onClose} className="btn-ghost text-xs">Cancel</button>
        </div>

        <div className="space-y-4">
          <input id="diary-title" type="text" placeholder="Give it a title…" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-base" />

          {/* Mood picker */}
          <div>
            <p className="text-xs text-muted-fg mb-2 uppercase tracking-wider">How was your day?</p>
            <div className="flex gap-2 flex-wrap">
              {MOODS.map((mood) => (
                <button key={mood} id={`diary-mood-${mood}`}
                  onClick={() => setForm({ ...form, mood: form.mood === mood ? '' : mood })}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all',
                    form.mood === mood ? 'ring-1' : 'glass hover:bg-surface-2'
                  )}
                  style={form.mood === mood ? {
                    background: `${MOOD_COLORS[mood]}22`,
                    borderColor: MOOD_COLORS[mood],
                    outlineColor: MOOD_COLORS[mood],
                  } : {}}>
                  {MOOD_EMOJIS[mood]} {mood.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Editor */}
          <textarea
            id="diary-content"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder={`Write about ${format(date, 'MMMM d')}…`}
            rows={10}
            className="input-base resize-none text-sm leading-relaxed font-serif"
          />

          <button id="diary-save" onClick={handleSave} disabled={isLoading || !form.content.trim()}
            className="btn-primary w-full disabled:opacity-50">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save entry'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Diary Page ───────────────────────────────────────────────────────────────
export default function DiaryPage() {
  const [viewDate, setViewDate] = useState(new Date());
  const [entries, setEntries] = useState<IDiaryEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<IDiaryEntry | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    diaryApi.getEntries({ month: format(viewDate, 'yyyy-MM') }).then(({ data }) => {
      setEntries(data.data);
    }).finally(() => setIsLoading(false));
  }, [viewDate]);

  const days = eachDayOfInterval({ start: startOfMonth(viewDate), end: endOfMonth(viewDate) });

  const getEntryForDay = (day: Date) =>
    entries.find((e) => isSameDay(new Date(e.date), day));

  const handleDayClick = (day: Date) => {
    const entry = getEntryForDay(day);
    setSelectedDate(day);
    setSelectedEntry(entry || null);
    setShowEditor(true);
  };

  return (
    <div className="page-container max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">Our Diary 📖</h1>
          <p className="section-subtitle">Your shared thoughts, one day at a time</p>
        </div>
        <button id="diary-new-btn" onClick={() => { setSelectedDate(new Date()); setSelectedEntry(null); setShowEditor(true); }}
          className="btn-primary">
          <Plus className="w-4 h-4" /> New Entry
        </button>
      </div>

      {/* Month calendar */}
      <div className="glass rounded-2xl p-6 mb-6">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-5">
          <button id="diary-prev-month" onClick={() => setViewDate(subMonths(viewDate, 1))} className="btn-ghost p-2">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="font-serif text-lg">{format(viewDate, 'MMMM yyyy')}</h2>
          <button id="diary-next-month" onClick={() => setViewDate(addMonths(viewDate, 1))} className="btn-ghost p-2">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
            <div key={d} className="text-center text-xs text-muted-fg py-1">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for start of month */}
          {Array.from({ length: days[0].getDay() }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {days.map((day) => {
            const entry = getEntryForDay(day);
            const isToday = isSameDay(day, new Date());
            return (
              <button
                key={day.toISOString()}
                id={`diary-day-${format(day, 'yyyy-MM-dd')}`}
                onClick={() => handleDayClick(day)}
                className={cn(
                  'relative flex flex-col items-center py-2 rounded-xl text-sm transition-all hover:bg-surface-2',
                  isToday && 'ring-1 ring-accent/50',
                  entry && 'bg-surface-2'
                )}
              >
                <span className={cn('text-sm', isToday && 'gradient-text font-semibold', !isToday && 'text-foreground')}>
                  {format(day, 'd')}
                </span>
                {entry?.mood && (
                  <span className="text-sm mt-0.5">{MOOD_EMOJIS[entry.mood]}</span>
                )}
                {entry && !entry.mood && (
                  <div className="w-1.5 h-1.5 rounded-full mt-1"
                    style={{ background: 'hsl(var(--accent))' }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent entries list */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-fg" /></div>
      ) : (
        <div className="space-y-3">
          {entries.slice(0, 5).map((entry) => (
            <motion.button
              key={entry._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              id={`diary-entry-${entry._id}`}
              onClick={() => { setSelectedDate(new Date(entry.date)); setSelectedEntry(entry); setShowEditor(true); }}
              className="glass-hover rounded-xl p-5 text-left w-full"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-fg">{format(new Date(entry.date), 'MMMM d, yyyy')}</span>
                    {entry.mood && <span>{MOOD_EMOJIS[entry.mood]}</span>}
                  </div>
                  {entry.title && <h3 className="font-serif text-sm font-medium text-foreground mb-1">{entry.title}</h3>}
                  <p className="text-sm text-muted-fg line-clamp-2">{entry.content}</p>
                </div>
                <BookOpen className="w-4 h-4 text-muted-fg shrink-0 mt-1" />
              </div>
            </motion.button>
          ))}
          {entries.length === 0 && (
            <div className="text-center py-8 text-muted-fg">
              <p className="text-sm">No entries this month. Click a day to start writing.</p>
            </div>
          )}
        </div>
      )}

      {showEditor && selectedDate && (
        <DiaryEditor
          date={selectedDate}
          entry={selectedEntry || undefined}
          onSave={(e) => setEntries((prev) => {
            const exists = prev.find((x) => x._id === e._id);
            return exists ? prev.map((x) => x._id === e._id ? e : x) : [e, ...prev];
          })}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  );
}
