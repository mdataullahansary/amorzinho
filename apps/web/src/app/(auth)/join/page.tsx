'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Heart, Copy, Check, Loader2, Users, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { coupleApi } from '@/lib/api';
import { cn } from '@/lib/utils';

type Step = 'choose' | 'create' | 'join';

export default function JoinPage() {
  const router = useRouter();
  const { setCouple, user } = useAuthStore();
  const [step, setStep] = useState<Step>('choose');
  const [inviteCode, setInviteCode] = useState('');
  const [myInviteCode, setMyInviteCode] = useState('');
  const [anniversaryDate, setAnniversaryDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // Guard: redirect unauthenticated users client-side only
  useEffect(() => {
    if (!user) router.push('/login');
  }, [user, router]);

  const handleCreate = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data } = await coupleApi.create({ anniversaryDate: anniversaryDate || undefined });
      setCouple(data.couple);
      setMyInviteCode(data.couple.inviteCode);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create space.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data } = await coupleApi.join(inviteCode);
      setCouple(data.couple);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid invite code.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(myInviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full"
          style={{ background: 'radial-gradient(circle, hsl(15 45% 80% / 0.08) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full"
          style={{ background: 'radial-gradient(circle, hsl(285 18% 57% / 0.08) 0%, transparent 70%)' }} />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass mb-4">
            <Heart className="w-8 h-8 fill-current" style={{ color: 'hsl(var(--accent))' }} />
          </div>
          <h1 className="font-serif text-3xl text-foreground mb-1">Your shared space</h1>
          <p className="text-muted-fg text-sm">Create a new space or join your partner&apos;s</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'choose' && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="grid gap-4"
            >
              <button
                id="join-create-btn"
                onClick={() => setStep('create')}
                className="glass-hover rounded-2xl p-6 text-left cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'hsl(var(--accent) / 0.15)' }}>
                    <Sparkles className="w-5 h-5" style={{ color: 'hsl(var(--accent))' }} />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-1">Create a new space</h3>
                    <p className="text-sm text-muted-fg">Start fresh. You&apos;ll get an invite code to share.</p>
                  </div>
                </div>
              </button>

              <button
                id="join-join-btn"
                onClick={() => setStep('join')}
                className="glass-hover rounded-2xl p-6 text-left cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'hsl(var(--accent-2) / 0.15)' }}>
                    <Users className="w-5 h-5" style={{ color: 'hsl(var(--accent-2))' }} />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-1">Join with invite code</h3>
                    <p className="text-sm text-muted-fg">Enter the code your partner shared with you.</p>
                  </div>
                </div>
              </button>
            </motion.div>
          )}

          {step === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="glass rounded-2xl p-8"
            >
              {!myInviteCode ? (
                <>
                  <h2 className="font-serif text-xl text-foreground mb-4">When did you get together?</h2>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label htmlFor="anniversary-date" className="text-xs font-medium text-muted-fg uppercase tracking-wider">
                        Anniversary date <span className="text-muted-fg/60">(optional)</span>
                      </label>
                      <input
                        id="anniversary-date"
                        type="date"
                        value={anniversaryDate}
                        onChange={(e) => setAnniversaryDate(e.target.value)}
                        className="input-base"
                      />
                    </div>
                    {error && <p className="text-sm text-red-400">{error}</p>}
                    <button
                      id="create-space-btn"
                      onClick={handleCreate}
                      disabled={isLoading}
                      className="btn-primary w-full"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create space'}
                    </button>
                    <button onClick={() => setStep('choose')} className="btn-ghost w-full text-sm">
                      Go back
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl glass flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-6 h-6 fill-current" style={{ color: 'hsl(var(--accent))' }} />
                  </div>
                  <h2 className="font-serif text-xl mb-2">Space created! 🎉</h2>
                  <p className="text-sm text-muted-fg mb-6">Share this code with your partner</p>

                  <div className="glass rounded-xl p-4 mb-4 flex items-center justify-between gap-3">
                    <span className="font-mono text-2xl font-bold gradient-text tracking-widest">
                      {myInviteCode}
                    </span>
                    <button onClick={copyCode} className="btn-ghost p-2 rounded-lg">
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <button
                    id="go-dashboard-btn"
                    onClick={() => router.push('/dashboard')}
                    className="btn-primary w-full"
                  >
                    Go to dashboard
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {step === 'join' && (
            <motion.div
              key="join"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="glass rounded-2xl p-8"
            >
              <h2 className="font-serif text-xl text-foreground mb-4">Enter invite code</h2>
              <div className="space-y-4">
                <input
                  id="invite-code-input"
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="e.g. A1B2C3D4"
                  maxLength={8}
                  className="input-base font-mono text-center text-xl tracking-widest uppercase"
                />
                {error && <p className="text-sm text-red-400">{error}</p>}
                <button
                  id="join-submit-btn"
                  onClick={handleJoin}
                  disabled={isLoading || inviteCode.length < 6}
                  className={cn('btn-primary w-full', (isLoading || inviteCode.length < 6) && 'opacity-60')}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join space'}
                </button>
                <button onClick={() => setStep('choose')} className="btn-ghost w-full text-sm">
                  Go back
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
