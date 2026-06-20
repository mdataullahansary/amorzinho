'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Film, Play, Pause, SkipBack, SkipForward, ExternalLink, Loader2 } from 'lucide-react';
import { useMovieStore } from '@/store/movieStore';
import { movieApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { formatDuration } from '@/lib/utils';

const REACTIONS = ['😂', '😮', '❤️', '🔥', '👏', '😢'];

export default function MoviePage() {
  const { sessionId, videoUrl, title, isPlaying, currentTime, setSession, play, pause, seek, applyState, endSession } = useMovieStore();
  const [url, setUrl] = useState('');
  const [movieTitle, setMovieTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const socket = getSocket();

  useEffect(() => {
    movieApi.getCurrentSession().then(({ data }) => {
      if (data.session) {
        setSession(data.session._id, data.session.videoUrl, data.session.title);
        socket.emit('movie:request-sync', { sessionId: data.session._id });
      }
    }).catch(() => null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.src = videoUrl || '';
  }, [videoUrl]);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.play().catch(() => null);
    else videoRef.current.pause();
  }, [isPlaying]);

  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 1) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  const handleCreate = async () => {
    if (!url) return;
    setIsCreating(true);
    try {
      const { data } = await movieApi.createSession({ videoUrl: url, title: movieTitle || undefined });
      setSession(data.session._id, data.session.videoUrl, data.session.title);
    } finally {
      setIsCreating(false);
    }
  };

  const handleReaction = (emoji: string) => {
    socket.emit('movie:react', { emoji });
  };

  if (!sessionId) {
    return (
      <div className="page-container max-w-2xl">
        <h1 className="section-title">Movie Night 🎬</h1>
        <p className="section-subtitle">Watch videos together, perfectly in sync</p>
        <div className="glass rounded-2xl p-8">
          <div className="space-y-4">
            <input id="movie-url" type="url" placeholder="Paste video URL (MP4, WebM)…" value={url}
              onChange={(e) => setUrl(e.target.value)} className="input-base" />
            <input id="movie-title" type="text" placeholder="Movie / video title (optional)" value={movieTitle}
              onChange={(e) => setMovieTitle(e.target.value)} className="input-base" />
            <button id="movie-start-btn" onClick={handleCreate} disabled={isCreating || !url}
              className="btn-primary w-full disabled:opacity-50">
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <>
                <Play className="w-4 h-4" /> Start Movie Night
              </>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Video */}
      <div className="flex-1 bg-black relative flex items-center justify-center">
        <video
          ref={videoRef}
          onTimeUpdate={(e) => applyState({ currentTime: e.currentTarget.currentTime })}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          className="max-h-full w-full"
        />
      </div>

      {/* Controls bar */}
      <div className="glass border-t border-border">
        {/* Progress */}
        <div className="h-1 w-full cursor-pointer" style={{ background: 'rgba(255,255,255,0.08)' }}
          onClick={(e) => {
            const pct = e.clientX / window.innerWidth;
            seek(pct * duration);
          }}>
          <div className="h-full" style={{
            width: `${progress}%`,
            background: 'linear-gradient(to right, hsl(var(--accent-2)), hsl(var(--accent)))',
          }} />
        </div>

        <div className="flex items-center gap-4 px-4 py-3">
          {/* Title */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{title || 'Movie Night'}</p>
            <p className="text-xs text-muted-fg tabular-nums">
              {formatDuration(currentTime)} / {formatDuration(duration)}
            </p>
          </div>

          {/* Playback controls */}
          <div className="flex items-center gap-3">
            <button id="movie-skip-back" onClick={() => seek(Math.max(0, currentTime - 10))}
              className="text-muted-fg hover:text-foreground transition-colors">
              <SkipBack className="w-4 h-4" />
            </button>
            <button id="movie-play-pause"
              onClick={() => isPlaying ? pause() : play()}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent-2)))' }}>
              {isPlaying
                ? <Pause className="w-4 h-4 text-white fill-white" />
                : <Play className="w-4 h-4 text-white fill-white ml-0.5" />}
            </button>
            <button id="movie-skip-forward" onClick={() => seek(Math.min(duration, currentTime + 10))}
              className="text-muted-fg hover:text-foreground transition-colors">
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Reactions */}
          <div className="flex gap-1">
            {REACTIONS.map((emoji) => (
              <button key={emoji} id={`movie-react-${emoji}`}
                onClick={() => handleReaction(emoji)}
                className="w-8 h-8 rounded-xl hover:bg-surface-2 flex items-center justify-center text-base transition-all hover:scale-125">
                {emoji}
              </button>
            ))}
          </div>

          <button id="movie-end" onClick={() => {
            if (sessionId) movieApi.endSession(sessionId);
            endSession();
          }} className="btn-ghost text-xs text-red-400 hover:bg-red-400/10">
            End session
          </button>
        </div>
      </div>
    </div>
  );
}
