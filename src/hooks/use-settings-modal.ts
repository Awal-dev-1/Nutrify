
'use client';

import { useContext } from 'react';
import { SettingsContext } from '@/components/providers/settings-provider';

export function useSettingsModal() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettingsModal must be used within a SettingsProvider');
  }
  return context;
}
