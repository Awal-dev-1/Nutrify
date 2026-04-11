'use client';

import { Logo } from '@/components/shared/logo';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background overflow-hidden"
        >
          {/* Subtle background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-background/50 to-background pointer-events-none" />
          
          {/* Ambient glow effect */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 0.3, 0], scale: [0.5, 1.5, 2] }}
            transition={{ duration: 1.5, ease: 'easeInOut', times: [0, 0.5, 1] }}
            className="absolute w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none"
          />
          
          {/* Main logo container */}
          <motion.div
            initial={{ scale: 0.8, filter: 'blur(10px)', opacity: 0 }}
            animate={{ 
              scale: [0.8, 1.2, 15], 
              opacity: [0, 1, 0],
              filter: ['blur(10px)', 'blur(0px)', 'blur(0px)'],
            }}
            transition={{
              duration: 1.5,
              ease: [0.4, 0, 0.2, 1],
              times: [0, 0.25, 1],
            }}
            className="relative z-10"
          >
            {/* Soft shadow behind logo */}
            <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full scale-110" />
            <Logo size="splash" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}