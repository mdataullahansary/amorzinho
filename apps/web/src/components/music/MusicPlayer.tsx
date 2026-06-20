'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, Heart, Music,
} from 'lucide-react';
import { useMusicStore } from '@/store/musicStore';
import { formatDuration } from '@/lib/utils';

export default function MusicPlayer() {
  const {
    currentTrack, isPlaying, position, duration, volume,
    play, pause, seek, setVolume, setPosition, setDuration,
  } = useMusicStore();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Sync audio element with store
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;
    audioRef.current.src = currentTrack.fileUrl;
    audioRef.current.volume = volume / 100;
    if (isPlaying) audioRef.current.play().catch(() => null);
  }, [currentTrack]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => null);
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  if (!currentTrack) return null;

  const progress = duration > 0 ? (position / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = progressRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = (e.clientX - rect.left) / rect.width;
    const newPos = pct * duration;
    seek(newPos);
    if (audioRef.current) audioRef.current.currentTime = newPos;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border"
      >
        {/* Hidden audio element */}
        <audio
          ref={audioRef}
          onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onEnded={() => pause()}
        />

        {/* Progress bar */}
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          className="h-1 w-full cursor-pointer relative group"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <div
            className="h-full transition-all duration-100 relative"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(to right, hsl(var(--accent-2)), hsl(var(--accent)))',
            }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'hsl(var(--accent))' }} />
          </div>
        </div>

        <div className="flex items-center px-4 py-3 gap-4">
          {/* Track info */}
          <div className="flex items-center gap-3 w-64 shrink-0">
            {currentTrack.albumArtUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentTrack.albumArtUrl} alt={currentTrack.title}
                className="w-10 h-10 rounded-lg object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'hsl(var(--accent) / 0.15)' }}>
                <Music className="w-4 h-4" style={{ color: 'hsl(var(--accent))' }} />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{currentTrack.title}</p>
              <p className="text-xs text-muted-fg truncate">{currentTrack.artist || 'Unknown'}</p>
            </div>
            <button id="player-favorite"
              className="ml-auto text-muted-fg hover:text-accent transition-colors">
              <Heart className="w-4 h-4" style={currentTrack.isFavorite ? { color: 'hsl(var(--accent))', fill: 'hsl(var(--accent))' } : {}} />
            </button>
          </div>

          {/* Controls */}
          <div className="flex-1 flex items-center justify-center gap-4">
            <button id="player-skip-back" className="text-muted-fg hover:text-foreground transition-colors">
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              id="player-play-pause"
              onClick={() => isPlaying ? pause() : play()}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent-2)))' }}
            >
              {isPlaying
                ? <Pause className="w-4 h-4 text-white fill-white" />
                : <Play className="w-4 h-4 text-white fill-white ml-0.5" />}
            </button>
            <button id="player-skip-forward" className="text-muted-fg hover:text-foreground transition-colors">
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Time + Volume */}
          <div className="flex items-center gap-3 w-64 justify-end">
            <span className="text-xs text-muted-fg tabular-nums">
              {formatDuration(position)} / {formatDuration(duration)}
            </span>
            <Volume2 className="w-4 h-4 text-muted-fg shrink-0" />
            <input
              id="player-volume"
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-20 accent-accent h-1"
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
