'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Heart, Loader2 } from 'lucide-react';
import { Suspense } from 'react';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setToken } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      router.push(`/login?error=${error}`);
      return;
    }

    if (token) {
      setToken(token).then(() => {
        const { user } = useAuthStore.getState();
        if (user && !user.coupleId) {
          router.push('/join');
        } else {
          router.push('/dashboard');
        }
      });
    } else {
      router.push('/login');
    }
  }, [searchParams, setToken, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass">
        <Heart className="w-8 h-8 fill-current" style={{ color: 'hsl(var(--accent))' }} />
      </div>
      <div className="flex items-center gap-2 text-muted-fg text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Signing you in…
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <CallbackHandler />
    </Suspense>
  );
}
