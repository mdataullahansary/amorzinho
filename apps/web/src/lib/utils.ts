import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format, differenceInDays } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatTime(date: Date | string): string {
  return format(new Date(date), 'h:mm a');
}

export function formatRelative(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function daysTogether(since: Date | string): number {
  return differenceInDays(new Date(), new Date(since));
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function daysUntilAnniversary(anniversaryDate: Date | string): number {
  const anniversary = new Date(anniversaryDate);
  const today = new Date();
  const nextAnniversary = new Date(
    today.getFullYear(),
    anniversary.getMonth(),
    anniversary.getDate()
  );
  if (nextAnniversary < today) {
    nextAnniversary.setFullYear(today.getFullYear() + 1);
  }
  return differenceInDays(nextAnniversary, today);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + '…' : str;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const MOOD_EMOJIS: Record<string, string> = {
  happy: '😊',
  sad: '😢',
  excited: '🎉',
  anxious: '😰',
  grateful: '🙏',
  'in-love': '💕',
  tired: '😴',
  romantic: '🌹',
};

export const MOOD_COLORS: Record<string, string> = {
  happy: '#f59e0b',
  sad: '#6366f1',
  excited: '#f97316',
  anxious: '#ef4444',
  grateful: '#10b981',
  'in-love': '#ec4899',
  tired: '#8b5cf6',
  romantic: '#e8c4b8',
};
