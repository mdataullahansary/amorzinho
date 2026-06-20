'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, MessageCircle, Music, ImageIcon,
  BookOpen, Film, ListChecks, BarChart2, Bell, LogOut,
  Menu
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const BOTTOM_NAV = [
  { href: '/dashboard', icon: Heart, label: 'Home' },
  { href: '/chat', icon: MessageCircle, label: 'Chat' },
  { href: '/music', icon: Music, label: 'Music' },
  { href: '/memories', icon: ImageIcon, label: 'Memories' },
];

const MORE_NAV = [
  { href: '/diary', icon: BookOpen, label: 'Diary' },
  { href: '/movie', icon: Film, label: 'Movie Night' },
  { href: '/bucket', icon: ListChecks, label: 'Bucket List' },
  { href: '/analytics', icon: BarChart2, label: 'Analytics' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 glass border-t border-border z-40 px-2 flex items-center justify-around pb-1">
      {BOTTOM_NAV.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors relative',
              active ? 'text-accent' : 'text-muted-fg hover:text-foreground'
            )}
          >
            <Icon className="w-5 h-5 relative z-10" />
            <span className="text-[10px] font-medium relative z-10">{label}</span>
            {active && (
              <motion.div
                layoutId="bottom-nav-active"
                className="absolute inset-1 rounded-xl"
                style={{ background: 'linear-gradient(135deg, hsl(var(--accent) / 0.15), hsl(var(--accent-2) / 0.05))' }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </Link>
        );
      })}

      {/* More Menu (Sheet) */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <button className="flex flex-col items-center justify-center w-16 h-full gap-1 text-muted-fg hover:text-foreground transition-colors">
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-3xl border-t border-border glass bg-background/80 p-6 h-[70vh]">
          <div className="space-y-4">
            <h3 className="font-serif text-2xl text-foreground">More</h3>
            <div className="grid grid-cols-2 gap-3">
              {MORE_NAV.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSheetOpen(false)}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl glass border border-border/50 text-foreground hover:bg-surface-2 transition-all gap-3"
                >
                  <Icon className="w-6 h-6 text-accent" />
                  <span className="text-sm font-medium">{label}</span>
                </Link>
              ))}
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-4 rounded-2xl border border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/10 transition-all gap-2 mt-6"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
