'use client';

import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { cn, getInitials } from '@/lib/utils';
import type { IUser } from '@amorzinho/shared';

export default function MobileHeader() {
  const { user, couple } = useAuthStore();
  const { isPartnerOnline } = useChatStore();

  const partner = couple
    ? (typeof couple.user1 === 'object'
        ? (couple.user1 as IUser)._id === user?._id
          ? couple.user2 as IUser
          : couple.user1 as IUser
        : null)
    : null;

  return (
    <header className="md:hidden flex items-center justify-between px-4 h-14 shrink-0 glass border-b border-border z-30 sticky top-0">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent-2)))' }}>
          <Heart className="w-3.5 h-3.5 text-white fill-white" />
        </div>
        <span className="font-serif text-lg text-foreground">
          Amorzinho
        </span>
      </div>

      {partner && (
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-xs font-medium text-foreground max-w-[100px] truncate">{(partner as IUser).name}</p>
            <p className="text-[10px]" style={{ color: isPartnerOnline ? 'hsl(var(--success))' : 'hsl(var(--muted-fg))' }}>
              {isPartnerOnline ? 'Online' : 'Offline'}
            </p>
          </div>
          <div className="relative shrink-0">
            {(partner as IUser).avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={(partner as IUser).avatar} alt={(partner as IUser).name}
                className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'hsl(var(--accent-2) / 0.3)', color: 'hsl(var(--accent))' }}>
                {getInitials((partner as IUser).name)}
              </div>
            )}
            <div className={cn('online-dot absolute bottom-0 right-0', !isPartnerOnline && 'bg-muted opacity-60')} />
          </div>
        </div>
      )}
    </header>
  );
}
