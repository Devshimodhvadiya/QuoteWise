import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import type { RequirementStatus } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | null | undefined): string {
  if (!date) return '—';
  return format(date, 'dd MMM yyyy');
}

export function formatDateTime(date: Date | null | undefined): string {
  if (!date) return '—';
  return format(date, 'dd MMM yyyy, HH:mm');
}

export function timeAgo(date: Date | null | undefined): string {
  if (!date) return '—';
  return formatDistanceToNow(date, { addSuffix: true });
}

export function getStatusColor(status: RequirementStatus): string {
  const colors: Record<RequirementStatus, string> = {
    Draft: 'bg-gray-100 text-gray-700 border-gray-200',
    Open: 'bg-blue-50 text-blue-700 border-blue-200',
    'Under Review': 'bg-amber-50 text-amber-700 border-amber-200',
    Completed: 'bg-green-50 text-green-700 border-green-200',
    Cancelled: 'bg-red-50 text-red-700 border-red-200',
  };
  return colors[status] ?? 'bg-gray-100 text-gray-700';
}

export function getRatingColor(rating: number): string {
  if (rating >= 4.5) return 'text-green-600';
  if (rating >= 3.5) return 'text-amber-500';
  return 'text-red-500';
}

export function getScoreColor(score: number): string {
  if (score >= 85) return 'text-green-600';
  if (score >= 70) return 'text-blue-600';
  if (score >= 55) return 'text-amber-500';
  return 'text-red-500';
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '…';
}

export * from './comparison';
