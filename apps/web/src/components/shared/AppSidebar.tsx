'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, MessageCircle, Music, BookOpen, ImageIcon,
  Film, ListChecks, BarChart2, Bell, LogOut, ChevronLeft,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { cn, getInitials } from '@/lib/utils';
import type { IUser } from '@amorzinho/shared';

const NAV = [
  { href: '/dashboard',  icon: Heart,        label: 'Home' },
  { href: '/chat',       icon: MessageCircle, label: 'Chat' },
  { href: '/music',      icon: Music,         label: 'Music' },
  { href: '/diary',      icon: BookOpen,      label: 'Diary' },
  { href: '/memories',   icon: ImageIcon,     label: 'Memories' },
  { href: '/movie',      icon: Film,          label: 'Movie Night' },
  { href: '/bucket',     icon: ListChecks,    label: 'Bucket List' },
  { href: '/analytics',  icon: BarChart2,     label: 'Analytics' },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, couple, logout } = useAuthStore();
  const { isPartnerOnline } = useChatStore();
  const [collapsed, setCollapsed] = useState(false);

  const partner = couple
    ? (typeof couple.user1 === 'object'
        ? (couple.user1 as IUser)._id === user?._id
          ? couple.user2 as IUser
          : couple.user1 as IUser
        : null)
    : null;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="flex flex-col h-screen glass border-r border-border shrink-0 overflow-hidden relative z-20"
    >
      {/* Header */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-border', collapsed && 'justify-center px-3')}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent-2)))' }}>
          <Heart className="w-4 h-4 text-white fill-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="font-serif text-lg text-foreground whitespace-nowrap overflow-hidden"
            >
              Amorzinho
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Partner Status */}
      {partner && !collapsed && (
        <div className="mx-3 mt-3 mb-1 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="flex items-center gap-2.5">
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
              <div className={cn('online-dot', !isPartnerOnline && 'bg-muted opacity-60')} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{(partner as IUser).name}</p>
              <p className="text-xs" style={{ color: isPartnerOnline ? 'hsl(var(--success))' : 'hsl(var(--muted-fg))' }}>
                {isPartnerOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative',
                collapsed && 'justify-center px-2',
                active
                  ? 'text-foreground'
                  : 'text-muted-fg hover:text-foreground hover:bg-surface-2'
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--accent) / 0.12), hsl(var(--accent-2) / 0.08))' }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className={cn('w-4 h-4 shrink-0 relative z-10', active && 'text-accent')}
                style={active ? { color: 'hsl(var(--accent))' } : {}} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="relative z-10 whitespace-nowrap overflow-hidden"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-3 border-t border-border space-y-0.5">
        <Link href="/notifications"
          className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-fg hover:text-foreground hover:bg-surface-2 transition-all', collapsed && 'justify-center')}>
          <Bell className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Notifications</span>}
        </Link>

        {/* User */}
        {user && (
          <div className={cn('flex items-center gap-2.5 px-3 py-2 mt-1', collapsed && 'justify-center')}>
            <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold"
              style={{ background: 'hsl(var(--accent) / 0.2)', color: 'hsl(var(--accent))' }}>
              {getInitials(user.name)}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-fg truncate">{user.email}</p>
              </div>
            )}
          </div>
        )}

        <button
          id="sidebar-logout"
          onClick={handleLogout}
          className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-fg hover:text-red-400 hover:bg-red-400/10 transition-all w-full', collapsed && 'justify-center')}>
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        id="sidebar-collapse"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-4 -right-3 w-6 h-6 rounded-full glass border border-border flex items-center justify-center text-muted-fg hover:text-foreground transition-all z-30"
      >
        <ChevronLeft className={cn('w-3 h-3 transition-transform duration-300', collapsed && 'rotate-180')} />
      </button>
    </motion.aside>
  );
}
