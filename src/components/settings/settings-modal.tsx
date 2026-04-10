
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import {
  User,
  KeyRound,
  Palette,
  Bell,
  FileBadge,
  ChevronRight,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { TransitionLink } from '@/components/shared/transition-link';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { href: '/dashboard/settings/profile', label: 'Profile', icon: User, description: 'Manage your name and photo.' },
  { href: '/dashboard/settings/account', label: 'Account & Security', icon: KeyRound, description: 'Manage password and delete account.' },
  { href: '/dashboard/settings/preferences', label: 'App Preferences', icon: Palette, description: 'Customize theme, language, and units.' },
  { href: '/dashboard/settings/notifications', label: 'Notifications', icon: Bell, description: 'Set your notification preferences.' },
  { href: '/dashboard/settings/privacy', label: 'Privacy & Data', icon: FileBadge, description: 'Manage your data and privacy settings.' },
];

function SettingsContent({ onClose }: { onClose: () => void }) {
    return (
        <div className="py-4 space-y-2">
            {navItems.map(item => (
                <TransitionLink
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 w-full text-left transition-colors"
                >
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <item.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </TransitionLink>
            ))}
        </div>
    );
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="bottom" className="rounded-t-2xl pb-safe">
                <SheetHeader className="text-left">
                    <SheetTitle>Settings</SheetTitle>
                    <SheetDescription>Select a category to manage your settings.</SheetDescription>
                </SheetHeader>
                <SettingsContent onClose={onClose} />
            </SheetContent>
        </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Select a category to manage your account settings.
          </DialogDescription>
        </DialogHeader>
        <SettingsContent onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}
