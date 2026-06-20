'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, Loader2, MoreHorizontal, Trash2 } from 'lucide-react';
import { bucketApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { IBucketItem, BucketCategory } from '@amorzinho/shared';

const CATEGORIES: BucketCategory[] = ['travel', 'experience', 'milestone', 'fun'];
const CATEGORY_COLORS: Record<BucketCategory, string> = {
  travel: '#f59e0b', experience: '#8b5cf6', milestone: '#10b981', fun: '#f97316',
};
const CATEGORY_EMOJIS: Record<BucketCategory, string> = {
  travel: '✈️', experience: '⭐', milestone: '🏆', fun: '🎉',
};

function AddItemModal({ onClose, onAdded }: { onClose: () => void; onAdded: (item: IBucketItem) => void }) {
  const [form, setForm] = useState({ title: '', description: '', category: 'experience' as BucketCategory, emoji: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleAdd = async () => {
    if (!form.title) return;
    setIsLoading(true);
    try {
      const { data } = await bucketApi.createItem(form);
      onAdded(data.item);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.94 }} animate={{ scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="glass rounded-2xl p-8 w-full max-w-md">
        <h2 className="font-serif text-xl mb-5">Add to bucket list</h2>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input id="bucket-emoji" type="text" placeholder="🌟" maxLength={2} value={form.emoji}
              onChange={(e) => setForm({ ...form, emoji: e.target.value })}
              className="input-base w-16 text-center text-xl" />
            <input id="bucket-title" type="text" placeholder="What do you want to do? *" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-base flex-1" />
          </div>
          <textarea id="bucket-desc" placeholder="Tell me more…" rows={2} value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-base resize-none" />
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => (
              <button key={cat} id={`bucket-cat-${cat}`}
                onClick={() => setForm({ ...form, category: cat })}
                className={cn('flex flex-col items-center gap-1 p-2.5 rounded-xl text-xs transition-all',
                  form.category === cat ? 'ring-1' : 'glass hover:bg-surface-2')}
                style={form.category === cat ? { background: `${CATEGORY_COLORS[cat]}22`, outlineColor: CATEGORY_COLORS[cat] } : {}}>
                <span className="text-xl">{CATEGORY_EMOJIS[cat]}</span>
                <span className="capitalize" style={form.category === cat ? { color: CATEGORY_COLORS[cat] } : {}}>{cat}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button id="bucket-add-submit" onClick={handleAdd}
              disabled={isLoading || !form.title}
              className="btn-primary flex-1 disabled:opacity-50">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add to list'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function BucketPage() {
  const [items, setItems] = useState<IBucketItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [activeCategory, setActiveCategory] = useState<BucketCategory | null>(null);

  const load = (cat?: BucketCategory | null) => {
    setIsLoading(true);
    bucketApi.getItems(cat || undefined).then(({ data }) => setItems(data.data)).finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (item: IBucketItem) => {
    const { data } = await bucketApi.updateItem(item._id, { isCompleted: !item.isCompleted });
    setItems((prev) => prev.map((i) => i._id === item._id ? data.item : i));
  };

  const handleDelete = async (id: string) => {
    await bucketApi.deleteItem(id);
    setItems((prev) => prev.filter((i) => i._id !== id));
  };

  const completed = items.filter((i) => i.isCompleted).length;
  const progress = items.length > 0 ? (completed / items.length) * 100 : 0;

  const filtered = activeCategory ? items.filter((i) => i.category === activeCategory) : items;

  return (
    <div className="page-container max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">Bucket List 🌟</h1>
          <p className="section-subtitle">Dreams you&apos;re building together</p>
        </div>
        <button id="bucket-add-btn" onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Dream
        </button>
      </div>

      {/* Progress */}
      {items.length > 0 && (
        <div className="glass rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">{completed} of {items.length} completed</span>
            <span className="text-sm font-bold gradient-text">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(to right, hsl(var(--accent-2)), hsl(var(--accent)))' }}
            />
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <button id="bucket-filter-all"
          onClick={() => { setActiveCategory(null); load(null); }}
          className={cn('btn-ghost text-xs px-4', !activeCategory && 'text-foreground bg-surface-2')}>
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button key={cat} id={`bucket-filter-${cat}`}
            onClick={() => { const next = activeCategory === cat ? null : cat; setActiveCategory(next); load(next); }}
            className={cn('badge text-xs cursor-pointer transition-all', activeCategory === cat ? 'badge-accent' : 'glass')}
            style={activeCategory === cat ? { background: `${CATEGORY_COLORS[cat]}22`, color: CATEGORY_COLORS[cat] } : {}}>
            {CATEGORY_EMOJIS[cat]} {cat}
          </button>
        ))}
      </div>

      {/* Items */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-fg" /></div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <motion.div
              key={item._id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-hover rounded-xl p-4 flex items-center gap-3 group"
            >
              <button
                id={`bucket-toggle-${item._id}`}
                onClick={() => handleToggle(item)}
                className={cn(
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                  item.isCompleted
                    ? 'border-transparent'
                    : 'border-border hover:border-accent'
                )}
                style={item.isCompleted ? {
                  background: 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent-2)))'
                } : {}}
              >
                {item.isCompleted && <Check className="w-3 h-3 text-white" />}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {item.emoji && <span>{item.emoji}</span>}
                  <p className={cn('text-sm font-medium', item.isCompleted ? 'line-through text-muted-fg' : 'text-foreground')}>
                    {item.title}
                  </p>
                </div>
                {item.description && <p className="text-xs text-muted-fg mt-0.5">{item.description}</p>}
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="badge text-xs"
                  style={{ background: `${CATEGORY_COLORS[item.category]}22`, color: CATEGORY_COLORS[item.category] }}>
                  {CATEGORY_EMOJIS[item.category]}
                </span>
                <button id={`bucket-delete-${item._id}`}
                  onClick={() => handleDelete(item._id)}
                  className="text-muted-fg hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-fg text-sm">
              No dreams in this category yet. Add one! ✨
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showAdd && <AddItemModal onClose={() => setShowAdd(false)} onAdded={(i) => setItems((prev) => [i, ...prev])} />}
      </AnimatePresence>
    </div>
  );
}
