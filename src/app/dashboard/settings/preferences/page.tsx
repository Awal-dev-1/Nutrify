
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { updateUserDocument } from '@/services/userService';
import { useToast } from '@/hooks/use-toast';
import { Palette, Save, Loader2, Moon, Sun, Laptop, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsCard } from '@/components/settings/settings-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from 'next-themes';

export default function PreferencesSettingsPage() {
    const { user, userProfile, isProfileLoading } = useUser();
    const db = useFirestore();
    const { toast } = useToast();
    const { setTheme, theme } = useTheme();

    const [language, setLanguage] = useState('en');
    const [units, setUnits] = useState('metric');
    const [initialLanguage, setInitialLanguage] = useState('en');
    const [initialUnits, setInitialUnits] = useState('metric');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (userProfile) {
            const lang = userProfile.preferences?.languagePreference || 'en';
            setLanguage(lang);
            setInitialLanguage(lang);
    
            const unitsPref = userProfile.preferences?.unitPreference || 'metric';
            setUnits(unitsPref);
            setInitialUnits(unitsPref);
        }
    }, [userProfile]);
    
    const hasPreferencesChanges = useMemo(() => {
        if (isProfileLoading) return false;
        return language !== initialLanguage || units !== initialUnits;
    }, [language, initialLanguage, units, initialUnits, isProfileLoading]);

    const handleThemeChange = (newTheme: string) => {
        setTheme(newTheme);
        if (user && db) {
          updateUserDocument(db, user.uid, { 'preferences.themePreference': newTheme })
            .then(() => {
              toast({ title: 'Theme preference saved!', duration: 3000 });
            })
            .catch((error) => {
              toast({
                variant: 'destructive',
                title: 'Error saving theme',
                description: 'Could not save your theme preference. Please try again.',
              });
            });
        }
    };
    
    const handlePreferencesSave = async () => {
        if (!user || !db || !hasPreferencesChanges) return;
        setIsSaving(true);
        const prefs = {
          'preferences.languagePreference': language,
          'preferences.unitPreference': units,
        };
        try {
          await updateUserDocument(db, user.uid, prefs);
          toast({ title: 'Preferences Saved!' });
          setInitialLanguage(language);
          setInitialUnits(units);
        } catch(error: any) {
          toast({ variant: "destructive", title: "Error Saving", description: "Could not save preferences." });
        } finally {
          setIsSaving(false);
        }
    };
    
    if (isProfileLoading) {
        return (
            <SettingsCard
                title="Preferences"
                description="Customize your app experience."
                icon={<Palette className="h-5 w-5" />}
            >
                <div className="space-y-6">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-11 w-full" />
                    <Skeleton className="h-11 w-full" />
                </div>
            </SettingsCard>
        );
    }
    
    return (
        <SettingsCard
            title="Preferences"
            description="Customize your app experience."
            icon={<Palette className="h-5 w-5" />}
            footer={
                <Button onClick={handlePreferencesSave} disabled={isSaving || !hasPreferencesChanges}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Preferences
                </Button>
            }
        >
            <div className="space-y-6">
                <div className="space-y-3"><Label className="text-base">Theme</Label><Tabs value={theme} onValueChange={handleThemeChange} className="w-full"><TabsList className="grid w-full grid-cols-3 h-auto p-1.5"><TabsTrigger value="light" className="flex flex-col items-center gap-1.5 p-2 h-full"><Sun className="h-5 w-5" /> Light</TabsTrigger><TabsTrigger value="dark" className="flex flex-col items-center gap-1.5 p-2 h-full"><Moon className="h-5 w-5" /> Dark</TabsTrigger><TabsTrigger value="system" className="flex flex-col items-center gap-1.5 p-2 h-full"><Laptop className="h-5 w-5" /> System</TabsTrigger></TabsList></Tabs></div>
                <div className="space-y-3"><Label htmlFor="language" className="text-base">Language</Label><Select value={language} onValueChange={setLanguage}><SelectTrigger id="language" className="h-11"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="tw">Twi (Ghana)</SelectItem><SelectItem value="ew">Ewe (Ghana)</SelectItem><SelectItem value="ha">Hausa</SelectItem></SelectContent></Select></div>
                <div className="space-y-3"><Label className="text-base">Measurement Units</Label><div className="flex gap-2"><Button variant={units === 'metric' ? 'default' : 'outline'} size="sm" onClick={() => setUnits('metric')} className="flex-1 rounded-full"><Ruler className="mr-2 h-4 w-4" /> Metric</Button><Button variant={units === 'imperial' ? 'default' : 'outline'} size="sm" onClick={() => setUnits('imperial')} className="flex-1 rounded-full">Imperial</Button></div><p className="text-xs text-muted-foreground">Metric: cm, kg • Imperial: ft, lbs</p></div>
            </div>
        </SettingsCard>
    );
}
