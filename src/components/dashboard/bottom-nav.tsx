'use client';

import { TransitionLink } from '@/components/shared/transition-link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, ScanLine, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const navItems = [
  { href: '/dashboard/overview', label: 'Home', icon: LayoutGrid },
  { href: '/dashboard/recognize', label: 'Recognize', icon: ScanLine },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart2 },
];

export function BottomNav() {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  if (!isMobile) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/90 backdrop-blur-sm md:hidden pb-safe">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <TransitionLink
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 w-full h-full rounded-lg transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:bg-accent/50'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </TransitionLink>
          );
        })}
      </div>
    </div>
  );
}
