import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CandidateStage, JobStatus } from '../types/database';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function getStageColor(stage: CandidateStage) {
  switch (stage) {
    case 'Applied':
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        badge: 'bg-blue-100 text-blue-800',
        dot: 'bg-blue-500',
      };
    case 'Screening':
      return {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
        badge: 'bg-purple-100 text-purple-800',
        dot: 'bg-purple-500',
      };
    case 'Interview':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        badge: 'bg-amber-100 text-amber-800',
        dot: 'bg-amber-500',
      };
    case 'Offer':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        badge: 'bg-emerald-100 text-emerald-800',
        dot: 'bg-emerald-500',
      };
    case 'Hired':
      return {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
        badge: 'bg-green-100 text-green-800',
        dot: 'bg-green-600',
      };
    case 'Rejected':
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        badge: 'bg-rose-100 text-rose-800',
        dot: 'bg-rose-500',
      };
    default:
      return {
        bg: 'bg-slate-50',
        text: 'text-slate-700',
        border: 'border-slate-200',
        badge: 'bg-slate-100 text-slate-800',
        dot: 'bg-slate-500',
      };
  }
}

export function getStatusColor(status: JobStatus) {
  switch (status) {
    case 'Open':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Draft':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Closed':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}

export const STAGES: CandidateStage[] = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];
