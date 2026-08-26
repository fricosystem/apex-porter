'use client';

import { formatPendingCount, shouldShowPendingBadge } from '@/lib/pending-counts';

interface PendingBadgeProps {
  count?: number;
  label?: string;
}

export default function PendingBadge({ count, label = 'pendências' }: PendingBadgeProps) {
  if (!shouldShowPendingBadge(count)) return null;

  return (
    <span
      aria-label={`${formatPendingCount(count)} ${label}`}
      className="absolute -left-2 -top-2 z-10 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-bold leading-4 text-white shadow-sm ring-2 ring-background dark:bg-orange-400 dark:text-orange-950"
    >
      {formatPendingCount(count)}
    </span>
  );
}
