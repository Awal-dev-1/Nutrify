
'use client';

import { usePathname } from 'next/navigation';
import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface PageLoaderContextType {
  isLoading: boolean;
  showLoader: () => void;
  hideLoader: () => void;
}

export const PageLoaderContext = createContext<PageLoaderContextType | undefined>(undefined);

export function PageLoaderProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Hide loader whenever the pathname changes (i.e., navigation completes)
    setIsLoading(false);
  }, [pathname]);

  const showLoader = useCallback(() => {
    setIsLoading(true);
  }, []);

  const hideLoader = useCallback(() => {
    setIsLoading(false);
  }, []);
  
  const value = { isLoading, showLoader, hideLoader };

  return (
    <PageLoaderContext.Provider value={value}>
      {children}
    </PageLoaderContext.Provider>
  );
}
