'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { SplashScreen } from '@/components/shared/splash-screen';

export function SplashProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // Wait for animation to finish before removing

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence>
        {isLoading && <SplashScreen />}
      </AnimatePresence>
      {!isLoading && children}
    </>
  );
}
