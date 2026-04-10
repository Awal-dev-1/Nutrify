
'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { TransitionLink } from '@/components/shared/transition-link';
import {
  LayoutGrid,
  Sparkles,
  Settings,
  Search,
  ScanLine,
  Bot,
  Calendar,
  BarChart2,
  HeartPulse,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettingsModal } from '@/hooks';

const features = [
  { href: '/dashboard/search',          label: 'AI Search',       icon: Search     },
  { href: '/dashboard/recognize',       label: 'AI Scan',         icon: ScanLine   },
  { href: '/dashboard/recommendations', label: 'Recommendations', icon: Bot        },
  { href: '/dashboard/planner',         label: 'Planner',         icon: Calendar   },
  { href: '/dashboard/tracker',         label: 'Tracker',         icon: HeartPulse },
  { href: '/dashboard/analytics',       label: 'Analytics',       icon: BarChart2  },
  { href: '/dashboard/goals',           label: 'Goals',           icon: Target     },
];

const FeaturesDrawer = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const pathname = usePathname();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t bg-background/90"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Section title */}
            <p className="text-center text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest py-2">
              Features
            </p>

            {/* 3-column grid */}
            <div className="grid grid-cols-3 gap-x-4 gap-y-6 px-6">
              {features.map((item, index) => {
                const isActive = pathname.startsWith(item.href);
                const isLastItemOnOwnRow = index === features.length - 1 && features.length % 3 === 1;

                return (
                  <TransitionLink
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex flex-col items-center justify-start gap-1.5 py-2 rounded-2xl active:scale-95 transition-all min-w-0',
                      isActive ? 'bg-primary/10' : 'hover:bg-accent',
                      isLastItemOnOwnRow && 'col-start-2'
                    )}
                  >
                    <div
                      className={cn(
                        'flex items-center justify-center h-11 w-11 rounded-full transition-colors shrink-0',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-primary/10 text-primary'
                      )}
                    >
                      <item.icon className="h-[18px] w-[18px]" />
                    </div>
                    <span
                      className={cn(
                        'text-[10px] font-medium leading-tight text-center w-full truncate',
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      )}
                    >
                      {item.label}
                    </span>
                  </TransitionLink>
                );
              })}
            </div>

            {/* Spacer that covers the nav bar height (64px) + safe area */}
            <div className="h-24 pb-safe" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export function BottomNav() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { openSettings } = useSettingsModal();

  if (!isMobile) {
    return null;
  }

  const isOverviewActive = pathname.startsWith('/dashboard/overview');
  const isSettingsActive = pathname.startsWith('/dashboard/settings');

  return (
    <>
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-lg pb-safe md:hidden',
          'gpu-layer'
        )}
      >
        <div className="flex h-16 items-center justify-around px-2">

          {/* Overview */}
          <TransitionLink
            href="/dashboard/overview"
            className={cn(
              'relative flex flex-col items-center justify-center gap-1 w-full h-full rounded-lg transition-colors active:scale-95 pt-1',
              isOverviewActive
                ? 'text-primary'
                : 'text-muted-foreground hover:bg-accent/50'
            )}
          >
            <LayoutGrid className="h-[22px] w-[22px]" />
            <span className="text-[11px] font-medium">Overview</span>
            {isOverviewActive && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-t-full bg-primary" />
            )}
          </TransitionLink>

          {/* Menu — toggles drawer open/close */}
          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="flex flex-col items-center justify-center gap-1 w-full h-full rounded-lg text-primary active:scale-95 transition-all"
            aria-label={isMenuOpen ? 'Close features menu' : 'Open features menu'}
            aria-expanded={isMenuOpen}
          >
            <motion.div
              animate={{ rotate: isMenuOpen ? 45 : 0, scale: isMenuOpen ? 0.9 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="flex items-center justify-center h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg -mt-5 ring-[3px] ring-background"
            >
              <Sparkles className="h-[22px] w-[22px]" />
            </motion.div>
            <span className="text-[11px] font-semibold -mt-0.5 transition-all">
              {isMenuOpen ? 'Close' : 'Menu'}
            </span>
          </button>

          {/* Settings */}
          <button
            onClick={openSettings}
            className={cn(
              'relative flex flex-col items-center justify-center gap-1 w-full h-full rounded-lg transition-colors active:scale-95 pt-1',
              isSettingsActive
                ? 'text-primary'
                : 'text-muted-foreground hover:bg-accent/50'
            )}
          >
            <Settings className="h-[22px] w-[22px]" />
            <span className="text-[11px] font-medium">Settings</span>
            {isSettingsActive && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-t-full bg-primary" />
            )}
          </button>

        </div>
      </div>

      <FeaturesDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
}
