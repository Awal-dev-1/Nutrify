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
          className="fixed inset-0 z-[9999]"
          aria-live="polite"
          aria-busy="true"
        >
          {/* Blur overlay */}
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm" />
          
          {/* Centered content */}
          <div className="relative h-full w-full flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ 
                duration: 0.2, 
                ease: 'easeInOut',
                delay: 0.05
              }}
              className="flex flex-col items-center gap-4"
            >
              {/* Spinner container */}
              <div className="relative">
                {/* Outer ring effect */}
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl" />
                
                {/* Spinner circle */}
                <div className="relative p-4 rounded-full bg-background shadow-lg">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              </div>
              
              {/* Optional loading text - can be removed if not needed */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                transition={{ delay: 0.1 }}
                className="text-sm text-muted-foreground font-medium"
              >
                Loading...
              </motion.p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}