
'use client';

import { TransitionLink } from '@/components/shared/transition-link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function SettingsSubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div
        className="flex items-center gap-4"
      >
        <Button variant="outline" size="icon" asChild>
          <TransitionLink href="/dashboard/overview">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to Dashboard</span>
          </TransitionLink>
        </Button>
        <div>
          <h1 className="text-h2 font-bold tracking-tight text-primary">
            Settings
          </h1>
          <p className="text-body text-muted-foreground">
            Manage your account and preferences.
          </p>
        </div>
      </div>

      <div>
        {children}
      </div>
    </div>
  );
}
