
'use client';

import React, { createContext, useState, ReactNode } from 'react';
import { SettingsModal } from '@/components/settings/settings-modal';

interface SettingsContextType {
  openSettings: () => void;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const openSettings = () => setIsSettingsOpen(true);
  const closeSettings = () => setIsSettingsOpen(false);

  return (
    <SettingsContext.Provider value={{ openSettings }}>
      {children}
      <SettingsModal isOpen={isSettingsOpen} onClose={closeSettings} />
    </SettingsContext.Provider>
  );
}
