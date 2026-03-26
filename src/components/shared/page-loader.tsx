
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { usePageLoader } from '@/hooks/use-page-loader';

export function PageLoader() {
  const { isLoading } = usePageLoader();

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          aria-live="polite"
          aria-busy="true"
        >
          {/* Blur overlay */}
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm" />
          
          {/* Spinner */}
          <div className="relative flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-background shadow-lg">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
