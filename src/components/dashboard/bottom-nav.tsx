
'use client';

import { TransitionLink } from '@/components/shared/transition-link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Search, Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/dashboard/overview', label: 'Overview', icon: LayoutGrid },
  { href: '/dashboard/search', label: 'AI Search', icon: Search },
  { href: '/dashboard/planner', label: 'Planner', icon: Calendar },
  { href: '/dashboard/settings', label: 'Profile', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  if (!isMobile) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/80 backdrop-blur-sm md:hidden pb-safe">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <TransitionLink
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 w-full h-full rounded-lg transition-colors active:scale-95',
                isActive ? 'text-primary' : 'text-muted-foreground hover:bg-accent/50'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <motion.div
                    layoutId="bottom-nav-active"
                    className="absolute bottom-1 w-5 h-1 rounded-full bg-primary"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
              )}
            </TransitionLink>
          );
        })}
      </div>
    </div>
  );
}
