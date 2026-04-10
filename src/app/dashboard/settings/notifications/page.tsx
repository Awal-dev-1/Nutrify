
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { updateUserDocument } from '@/services/userService';
import { useToast } from '@/hooks/use-toast';
import { Bell, Save, Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SettingsCard } from '@/components/settings/settings-card';
import { Skeleton } from '@/components/ui/skeleton';

export default function NotificationsSettingsPage() {
    const { user, userProfile, isProfileLoading } = useUser();
    const db = useFirestore();
    const { toast } = useToast();

    const [dailyReminder, setDailyReminder] = useState(false);
    const [weeklySummary, setWeeklySummary] = useState(false);
    const [initialDailyReminder, setInitialDailyReminder] = useState(false);
    const [initialWeeklySummary, setInitialWeeklySummary] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    useEffect(() => {
        if (userProfile) {
            const daily = userProfile.preferences?.reminderEnabled || false;
            setDailyReminder(daily);
            setInitialDailyReminder(daily);
    
            const weekly = userProfile.preferences?.weeklySummaryEnabled || false;
            setWeeklySummary(weekly);
            setInitialWeeklySummary(weekly);
        }
    }, [userProfile]);

    const hasNotificationsChanges = useMemo(() => {
        if (isProfileLoading) return false;
        return dailyReminder !== initialDailyReminder || weeklySummary !== initialWeeklySummary;
    }, [dailyReminder, initialDailyReminder, weeklySummary, initialWeeklySummary, isProfileLoading]);

    const handleNotificationsSave = async () => {
        if (!user || !db || !hasNotificationsChanges) return;
        setIsSaving(true);
        const prefs = {
          'preferences.reminderEnabled': dailyReminder,
          'preferences.weeklySummaryEnabled': weeklySummary,
        };
        try {
          await updateUserDocument(db, user.uid, prefs);
          toast({ title: 'Notification Preferences Saved!' });
          setInitialDailyReminder(dailyReminder);
          setInitialWeeklySummary(weeklySummary);
        } catch(error: any) {
          toast({ variant: "destructive", title: "Error Saving", description: "Could not save notification settings." });
        } finally {
          setIsSaving(false);
        }
    };

    if (isProfileLoading) {
        return (
            <SettingsCard
                title="Notifications"
                description="Control how and when we notify you."
                icon={<Bell className="h-5 w-5" />}
            >
                <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
            </SettingsCard>
        );
    }

    return (
        <SettingsCard
            title="Notifications"
            description="Control how and when we notify you."
            icon={<Bell className="h-5 w-5" />}
            footer={
                <Button onClick={handleNotificationsSave} disabled={isSaving || !hasNotificationsChanges}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Notification Settings
                </Button>
            }
        >
            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1 pr-4">
                        <Label htmlFor="daily-reminder" className="text-base font-medium">Daily Meal Reminder</Label>
                        <p className="text-sm text-muted-foreground">Get a daily reminder to log your meals</p>
                    </div>
                    <Switch id="daily-reminder" checked={dailyReminder} onCheckedChange={setDailyReminder}/>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1 pr-4">
                        <Label htmlFor="weekly-summary" className="text-base font-medium">Weekly Nutrition Summary</Label>
                        <p className="text-sm text-muted-foreground">Receive a summary of your week's nutrition by email.</p>
                    </div>
                    <Switch id="weekly-summary" checked={weeklySummary} onCheckedChange={setWeeklySummary}/>
                </div>
            </div>
        </SettingsCard>
    );
}
