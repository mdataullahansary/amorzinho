'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageIcon, Plus, X, Loader2, Filter, Tag } from 'lucide-react';
import { memoriesApi } from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import type { IMemory, MemoryTag } from '@amorzinho/shared';

const TAGS: MemoryTag[] = ['trip', 'anniversary', 'date', 'milestone', 'birthday', 'random'];
const TAG_COLORS: Record<MemoryTag, string> = {
  trip: '#f59e0b', anniversary: '#ec4899', date: '#8b5cf6',
  milestone: '#10b981', birthday: '#f97316', random: '#6366f1',
};
const TAG_EMOJIS: Record<MemoryTag, string> = {
  trip: '✈️', anniversary: '💑', date: '🌹',
  milestone: '🏆', birthday: '🎂', random: '⭐',
};

// ─── Upload Modal ─────────────────────────────────────────────────────────────
function UploadMemoryModal({ onClose, onCreated }: { onClose: () => void; onCreated: (m: IMemory) => void }) {
  const [form, setForm] = useState({ title: '', description: '', date: '', tags: [] as MemoryTag[] });
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleTag = (tag: MemoryTag) =>
    setForm((f) => ({
      ...f, tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));

  const handleCreate = async () => {
    if (!form.title) return;
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      if (form.description) formData.append('description', form.description);
      if (form.date) formData.append('date', form.date);
      formData.append('tags', JSON.stringify(form.tags));
      files.forEach((f) => formData.append('media', f));
      const { data } = await memoriesApi.createMemory(formData);
      onCreated(data.memory);
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
        className="glass rounded-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="font-serif text-xl mb-5">Add a memory ✨</h2>
        <div className="space-y-3">
          <input id="memory-title" type="text" placeholder="What happened? *" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-base" />
          <textarea id="memory-desc" placeholder="Tell the story…" rows={3} value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-base resize-none" />
          <input id="memory-date" type="date" value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })} className="input-base" />

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {TAGS.map((tag) => (
              <button key={tag} id={`memory-tag-${tag}`}
                onClick={() => toggleTag(tag)}
                className={cn('badge text-xs transition-all', form.tags.includes(tag) ? 'badge-accent' : 'glass')}
                style={form.tags.includes(tag) ? { background: `${TAG_COLORS[tag]}22`, color: TAG_COLORS[tag], borderColor: `${TAG_COLORS[tag]}44` } : {}}>
                {TAG_EMOJIS[tag]} {tag}
              </button>
            ))}
          </div>

          {/* File picker */}
          <label htmlFor="memory-files" className="btn-glass w-full justify-center cursor-pointer">
            <ImageIcon className="w-4 h-4" />
            {files.length > 0 ? `${files.length} file(s) selected` : 'Add photos / videos'}
          </label>
          <input id="memory-files" type="file" multiple accept="image/*,video/*" className="hidden"
            onChange={(e) => setFiles(Array.from(e.target.files || []))} />

          {/* Preview thumbnails */}
          {files.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {files.slice(0, 6).map((f, i) => (
                <div key={i} className="relative w-16 h-16">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover rounded-lg" />
                  <button onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                    <X className="w-2.5 h-2.5 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button id="memory-save" onClick={handleCreate}
              disabled={isLoading || !form.title}
              className="btn-primary flex-1 disabled:opacity-50">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save memory'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Memories Page ────────────────────────────────────────────────────────────
export default function MemoriesPage() {
  const [memories, setMemories] = useState<IMemory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [activeTag, setActiveTag] = useState<MemoryTag | null>(null);

  const load = (tag?: MemoryTag | null) => {
    setIsLoading(true);
    memoriesApi.getMemories(tag ? { tag } : {}).then(({ data }) => {
      setMemories(data.data);
    }).finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleTagFilter = (tag: MemoryTag) => {
    const next = activeTag === tag ? null : tag;
    setActiveTag(next);
    load(next);
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">Memories 📸</h1>
          <p className="section-subtitle">Every moment, beautifully preserved</p>
        </div>
        <button id="memory-new-btn" onClick={() => setShowUpload(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Memory
        </button>
      </div>

      {/* Tag filters */}
      <div className="flex gap-2 flex-wrap mb-5">
        <div className="flex items-center gap-1 text-muted-fg text-xs mr-1">
          <Filter className="w-3 h-3" /> Filter:
        </div>
        {TAGS.map((tag) => (
          <button key={tag} id={`filter-${tag}`}
            onClick={() => handleTagFilter(tag)}
            className={cn('badge text-xs transition-all cursor-pointer', activeTag === tag ? 'badge-accent' : 'glass hover:bg-surface-2')}
            style={activeTag === tag ? { background: `${TAG_COLORS[tag]}22`, color: TAG_COLORS[tag] } : {}}>
            {TAG_EMOJIS[tag]} {tag}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-fg" /></div>
      ) : memories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-fg gap-3">
          <ImageIcon className="w-12 h-12 opacity-20" />
          <p className="text-sm">No memories yet. Add your first one!</p>
        </div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {memories.map((memory, idx) => (
            <motion.div
              key={memory._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              id={`memory-card-${memory._id}`}
              className="break-inside-avoid glass-hover rounded-2xl overflow-hidden cursor-pointer group"
            >
              {memory.mediaItems[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={memory.mediaItems[0].url}
                  alt={memory.title}
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
              <div className="p-3">
                <h3 className="text-sm font-medium text-foreground mb-1">{memory.title}</h3>
                <p className="text-xs text-muted-fg">{formatDate(memory.date)}</p>
                {memory.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-2">
                    {memory.tags.map((t) => (
                      <span key={t} className="text-xs" style={{ color: TAG_COLORS[t] }}>
                        {TAG_EMOJIS[t]}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showUpload && (
          <UploadMemoryModal
            onClose={() => setShowUpload(false)}
            onCreated={(m) => setMemories((prev) => [m, ...prev])}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
