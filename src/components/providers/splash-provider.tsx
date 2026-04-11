'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { SplashScreen } from '@/components/shared/splash-screen';
import { useIsMobile } from '@/hooks/use-mobile';

export function SplashProvider({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // Wait for animation to finish before removing

    return () => clearTimeout(timer);
  }, []);

  // Only show the splash screen on mobile devices.
  const shouldShowSplash = isMobile && isLoading;

  return (
    <>
      <AnimatePresence>
        {shouldShowSplash && <SplashScreen />}
      </AnimatePresence>
      {/* 
        Always render children to avoid hydration errors. The splash screen is a 
        fixed overlay, so it will appear on top. The flicker of content before 
        the splash appears is a known trade-off for this approach to avoid 
        server/client mismatches without complex CSS workarounds.
      */}
      {children}
    </>
  );
}
