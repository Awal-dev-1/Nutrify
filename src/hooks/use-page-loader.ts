
'use client';

import { useContext } from 'react';
import { PageLoaderContext } from '@/components/providers/page-loader-provider';

export function usePageLoader() {
  const context = useContext(PageLoaderContext);
  if (context === undefined) {
    throw new Error('usePageLoader must be used within a PageLoaderProvider');
  }
  return context;
}
