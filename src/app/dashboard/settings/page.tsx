
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSettingsModal } from '@/hooks/use-settings-modal';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/shared/logo';

// This page now acts as a trigger for the modal and a fallback.
export default function SettingsPage() {
  const router = useRouter();
  const { openSettings } = useSettingsModal();

  useEffect(() => {
    // Open the modal immediately
    openSettings();
    // Redirect back to the overview page as the modal is now the primary interface
    router.replace('/dashboard/overview');
  }, [router, openSettings]);

  // Show a loading state while redirecting
  return (
      <div className="min-h-dvh flex items-center justify-center bg-gradient-to-b from-background to-secondary/5">
        <div className="text-center space-y-6 p-4">
          <Logo className="justify-center text-2xl" />
          <div className="relative flex justify-center items-center h-16">
            <div className="absolute h-16 w-16 bg-primary/10 rounded-full blur-2xl animate-pulse"></div>
            <Loader2 className="h-10 w-10 animate-spin text-primary relative" />
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground">Opening Settings...</p>
          </div>
        </div>
      </div>
  );
}
