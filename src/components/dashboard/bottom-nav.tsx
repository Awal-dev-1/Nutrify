'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { TransitionLink } from '@/components/shared/transition-link';
import {
  LayoutGrid,
  Sparkles,
  User,
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

const features = [
  { href: '/dashboard/search', label: 'AI Search', icon: Search },
  { href: '/dashboard/recognize', label: 'AI Scan', icon: ScanLine },
  { href: '/dashboard/recommendations', label: 'Recommendations', icon: Bot },
  { href: '/dashboard/planner', label: 'Planner', icon: Calendar },
  { href: '/dashboard/tracker', label: 'Tracker', icon: HeartPulse },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/dashboard/goals', label: 'Goals', icon: Target },
];

const FeaturesDrawer = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t bg-background/95 p-4 pb-safe backdrop-blur-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto w-12 h-1.5 rounded-full bg-muted-foreground/30 mb-4" />
            <div className="grid grid-cols-3 gap-4 text-center">
              {features.map((item) => (
                <TransitionLink
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl hover:bg-accent active:scale-95 transition-all"
                >
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 text-primary">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
                </TransitionLink>
              ))}
            </div>
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

  if (!isMobile) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t bg-background/80 backdrop-blur-lg pb-safe md:hidden">
        <div className="flex h-16 items-center justify-around px-2">
          {/* Overview */}
          <TransitionLink
            href="/dashboard/overview"
            className={cn(
              'relative flex flex-col items-center justify-center gap-1 w-full h-full rounded-lg transition-colors active:scale-95',
              pathname.startsWith('/dashboard/overview') ? 'text-primary' : 'text-muted-foreground hover:bg-accent/50'
            )}
          >
            <LayoutGrid className="h-6 w-6" />
            <span className="text-xs font-medium">Overview</span>
          </TransitionLink>
          
          {/* Menu Button */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-1 w-full h-full rounded-lg text-primary active:scale-95 transition-all"
            aria-label="Open features menu"
          >
             <div className="flex items-center justify-center h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg -mt-4 ring-4 ring-background">
                <Sparkles className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold -mt-1">Menu</span>
          </button>

          {/* Profile */}
           <TransitionLink
            href="/dashboard/settings"
            className={cn(
              'relative flex flex-col items-center justify-center gap-1 w-full h-full rounded-lg transition-colors active:scale-95',
              pathname.startsWith('/dashboard/settings') ? 'text-primary' : 'text-muted-foreground hover:bg-accent/50'
            )}
          >
            <User className="h-6 w-6" />
            <span className="text-xs font-medium">Profile</span>
          </TransitionLink>
        </div>
      </div>
      <FeaturesDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
}
