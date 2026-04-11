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
          {/* Background gradient effect */}
          <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent opacity-50" />
          
          {/* Animated rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: [0.8, 2, 3],
                  opacity: [0, 0.3, 0],
                }}
                transition={{
                  duration: 1.5,
                  ease: 'easeOut',
                  delay: i * 0.1,
                  times: [0, 0.5, 1],
                }}
                className="absolute rounded-full border-2 border-primary/20"
                style={{
                  width: `${100 + i * 50}px`,
                  height: `${100 + i * 50}px`,
                }}
              />
            ))}
          </div>

          {/* Main logo container */}
          <motion.div
            initial={{ scale: 0.8, filter: 'blur(10px)', opacity: 0 }}
            animate={{ 
              scale: [0.8, 1.1, 15], 
              opacity: [0, 1, 1, 0],
              filter: ['blur(10px)', 'blur(0px)', 'blur(0px)', 'blur(0px)'],
            }}
            transition={{
              duration: 1.5,
              ease: 'easeInOut',
              times: [0, 0.2, 0.7, 1],
            }}
            className="relative z-10"
          >
            {/* Logo glow effect */}
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl scale-150" />
            <div className="relative">
              <Logo size="splash" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}