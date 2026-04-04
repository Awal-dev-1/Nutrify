'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertTriangle, AlertCircle as AlertCircleIcon } from 'lucide-react';
import type { FC } from 'react';

const SuitabilityBadge: FC<{ suitability?: 'Suitable' | 'Moderately Suitable' | 'Not Suitable' }> = ({ suitability }) => {
  if (!suitability) return null;

  const variants = {
    'Suitable': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800',
    'Moderately Suitable': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800',
    'Not Suitable': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800',
  };
  const Icon = {
    'Suitable': CheckCircle,
    'Moderately Suitable': AlertTriangle,
    'Not Suitable': AlertCircleIcon,
  }[suitability];

  return (
    <Badge className={cn('text-sm px-3 py-1 shrink-0 whitespace-nowrap gap-1.5', variants[suitability])}>
      <Icon className="h-3.5 w-3.5" />
      {suitability}
    </Badge>
  );
};

export default SuitabilityBadge;

    