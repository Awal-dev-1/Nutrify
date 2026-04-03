'use client';

import { Logo } from '@/components/shared/logo';
import { motion } from 'framer-motion';

export function SplashScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background"
    >
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
          times: [0, 0.2, 0.7, 1], // Appear, Pulse, Hold, Disappear
        }}
      >
        <Logo size="splash" />
      </motion.div>
    </motion.div>
  );
}
