
'use client';

import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export const MacroStat = ({ icon, label, value, goal, color }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  goal: number;
  color: string;
}) => {
  const percentage = goal > 0 ? (value / goal) * 100 : 0;
  return (
    <motion.div whileHover={{ scale: 1.02 }} className="text-center p-2 sm:p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-1 sm:mb-2 flex-wrap">
        {icon}
        <span className="font-medium text-xs sm:text-sm">{label}</span>
      </div>
      <p className="text-lg sm:text-xl font-bold tabular-nums leading-none">{value.toFixed(0)}g</p>
      <div className="mt-1.5 sm:mt-2 space-y-0.5 sm:space-y-1">
        <Progress value={Math.min(percentage, 100)} className="h-1.5" indicatorClassName={cn(color, percentage > 100 && 'bg-amber-500')} />
        <p className="text-[10px] sm:text-xs text-muted-foreground tabular-nums">Goal: {goal.toFixed(0)}g</p>
      </div>
    </motion.div>
  );
};
