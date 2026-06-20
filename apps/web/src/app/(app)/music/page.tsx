'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Music, Upload, Heart, Play, Pause, Search, Plus, Loader2,
} from 'lucide-react';
import { useMusicStore } from '@/store/musicStore';
import { useAuthStore } from '@/store/authStore';
import { musicApi } from '@/lib/api';
import { formatDuration, cn } from '@/lib/utils';
import type { IUploadedTrack } from '@amorzinho/shared';

// ─── Upload Modal ─────────────────────────────────────────────────────────────
function UploadModal({ onClose, onUploaded }: { onClose: () => void; onUploaded: (track: IUploadedTrack) => void }) {
  const [form, setForm] = useState({ title: '', artist: '', album: '' });
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async () => {
    if (!file || !form.title) return;
    setIsLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('title', form.title);
      if (form.artist) formData.append('artist', form.artist);
      if (form.album) formData.append('album', form.album);
      const { data } = await musicApi.uploadSong(formData);
      onUploaded(data.song);
      onClose();
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass rounded-2xl p-8 w-full max-w-md">
        <h2 className="font-serif text-xl mb-5">Upload a song</h2>
        <div className="space-y-3">
          <input id="upload-title" type="text" placeholder="Title *" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-base" />
          <input id="upload-artist" type="text" placeholder="Artist" value={form.artist}
            onChange={(e) => setForm({ ...form, artist: e.target.value })} className="input-base" />
          <input id="upload-album" type="text" placeholder="Album" value={form.album}
            onChange={(e) => setForm({ ...form, album: e.target.value })} className="input-base" />
          <label className="btn-glass w-full justify-center cursor-pointer" htmlFor="audio-file-input">
            <Upload className="w-4 h-4" />
            {file ? file.name : 'Choose audio file (MP3, WAV, M4A)'}
          </label>
          <input id="audio-file-input" type="file" accept=".mp3,.wav,.m4a,audio/*" className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)} />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button id="upload-submit" onClick={handleUpload}
              disabled={isLoading || !file || !form.title}
              className="btn-primary flex-1 disabled:opacity-50">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upload'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Track Card ───────────────────────────────────────────────────────────────
function TrackCard({ track, isPlaying, isActive, onPlay, onFavorite }:
  { track: IUploadedTrack; isPlaying: boolean; isActive: boolean; onPlay: () => void; onFavorite: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'glass-hover rounded-xl p-4 flex items-center gap-3 cursor-pointer group',
        isActive && 'ring-1 ring-accent/50'
      )}
      onClick={onPlay}
    >
      {/* Album art */}
      <div className="relative w-11 h-11 rounded-lg shrink-0 flex items-center justify-center"
        style={{ background: 'hsl(var(--accent) / 0.1)' }}>
        {track.albumArtUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={track.albumArtUrl} alt={track.title} className="w-full h-full object-cover rounded-lg" />
          : <Music className="w-5 h-5" style={{ color: 'hsl(var(--accent))' }} />}
        {isActive && isPlaying && (
          <div className="absolute inset-0 rounded-lg flex items-center justify-center bg-black/50">
            <div className="flex items-end gap-0.5 h-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="waveform-bar w-1 animate-pulse-slow"
                  style={{ height: `${[50, 100, 70][i - 1]}%`, animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium truncate', isActive ? 'gradient-text' : 'text-foreground')}>
          {track.title}
        </p>
        <p className="text-xs text-muted-fg truncate">{track.artist || 'Unknown artist'}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button id={`fav-${track._id}`} onClick={(e) => { e.stopPropagation(); onFavorite(); }}
          className="text-muted-fg hover:text-accent transition-colors">
          <Heart className="w-4 h-4" style={track.isFavorite ? { fill: 'hsl(var(--accent))', color: 'hsl(var(--accent))' } : {}} />
        </button>
        <button id={`play-${track._id}`} className="text-muted-fg hover:text-foreground transition-colors">
          {isActive && isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
      </div>

      {track.duration && (
        <span className="text-xs text-muted-fg tabular-nums ml-2">{formatDuration(track.duration)}</span>
      )}
    </motion.div>
  );
}

// ─── Music Page ───────────────────────────────────────────────────────────────
export default function MusicPage() {
  const { couple } = useAuthStore();
  const { currentTrack, isPlaying, setTrack, play, pause } = useMusicStore();
  const [songs, setSongs] = useState<IUploadedTrack[]>([]);
  const [search, setSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');

  useEffect(() => {
    if (!couple) return;
    setIsLoading(true);
    musicApi.getSongs({ favorite: activeTab === 'favorites' || undefined }).then(({ data }) => {
      setSongs(data.data);
    }).finally(() => setIsLoading(false));
  }, [couple, activeTab]);

  const filtered = songs.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.artist?.toLowerCase().includes(search.toLowerCase())
  );

  const handlePlay = (track: IUploadedTrack) => {
    if (currentTrack?._id === track._id) {
      isPlaying ? pause() : play();
    } else {
      setTrack(track);
      play(0);
    }
  };

  const handleFavorite = async (track: IUploadedTrack) => {
    await musicApi.toggleFavorite(track._id);
    setSongs((prev) => prev.map((s) => s._id === track._id ? { ...s, isFavorite: !s.isFavorite } : s));
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">Listening Together 🎵</h1>
          <p className="section-subtitle">Your private music library</p>
        </div>
        <button id="upload-song-btn" onClick={() => setShowUpload(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Song
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['all', 'favorites'] as const).map((tab) => (
          <button key={tab} id={`music-tab-${tab}`}
            onClick={() => setActiveTab(tab)}
            className={cn('btn-ghost px-4 capitalize', activeTab === tab && 'text-foreground bg-surface-2')}>
            {tab === 'favorites' ? '❤️ Favorites' : '🎵 All Songs'}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg" />
        <input id="music-search" type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search songs…" className="input-base pl-10" />
      </div>

      {/* Song list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-fg" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-fg">
          <Music className="w-10 h-10 opacity-30" />
          <p className="text-sm">No songs yet. Upload your first one!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((track) => (
            <TrackCard
              key={track._id}
              track={track}
              isActive={currentTrack?._id === track._id}
              isPlaying={isPlaying}
              onPlay={() => handlePlay(track)}
              onFavorite={() => handleFavorite(track)}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showUpload && (
          <UploadModal
            onClose={() => setShowUpload(false)}
            onUploaded={(t) => setSongs((prev) => [t, ...prev])}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
