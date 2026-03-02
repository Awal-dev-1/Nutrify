'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { updateUserDocument } from '@/services/userService';
import { logout, resetPassword, deleteUserAccount } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  ShieldCheck,
  Palette,
  Bell,
  FileText,
  LogOut,
  Save,
  AlertTriangle,
  Download,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SettingsCard } from '@/components/settings/settings-card';
import { ThemeToggle } from '@/components/settings/theme-toggle';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { updateProfile } from 'firebase/auth';


export default function SettingsPage() {
  const { user, userProfile, isProfileLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  // State for form fields
  const [displayName, setDisplayName] = useState('');
  const [language, setLanguage] = useState('en');
  const [units, setUnits] = useState('metric');
  const [dailyReminder, setDailyReminder] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [goalAlerts, setGoalAlerts] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Initialize state from userProfile
  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.name || '');
      setLanguage(userProfile.preferences?.languagePreference || 'en');
      setUnits(userProfile.preferences?.unitPreference || 'metric');
      setDailyReminder(userProfile.preferences?.reminderEnabled || false);
      // These fields are not in the schema yet, but UI is there.
      // setWeeklySummary(userProfile.preferences?.weeklySummary || false);
      // setGoalAlerts(userProfile.preferences?.goalAlerts || false);
    }
  }, [userProfile]);

  const handleProfileSave = async () => {
    if (!user || !db || !auth.currentUser) return;
    setIsSaving(true);
    try {
      await updateUserDocument(db, user.uid, { name: displayName });
      await updateProfile(auth.currentUser, { displayName });
      toast({ title: 'Profile Saved!', description: 'Your display name has been updated.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreferencesSave = async () => {
    if (!user || !db) return;
    setIsSaving(true);
    try {
        const prefs = {
            'preferences.languagePreference': language,
            'preferences.unitPreference': units,
            'preferences.reminderEnabled': dailyReminder,
        };
        await updateUserDocument(db, user.uid, prefs);
        toast({ title: 'Preferences Saved!' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error saving preferences', description: error.message });
    } finally {
        setIsSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) {
      toast({ variant: 'destructive', title: 'Error', description: 'No email address found for your account.' });
      return;
    }
    try {
      await resetPassword(auth, user.email);
      toast({ title: 'Password Reset Email Sent', description: `An email has been sent to ${user.email}.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };
  
  const handleAccountDelete = async () => {
    setIsSaving(true);
    try {
      await deleteUserAccount(auth, db);
      toast({ title: "Account Deleted", description: "Your account has been permanently deleted." });
      router.push('/');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout(auth);
      router.push('/');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Logout Failed', description: error.message });
    }
  };

  if (isProfileLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="lg:col-span-1 space-y-8">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const isDeleteDisabled = deleteConfirmText !== 'DELETE';

  return (
    <div className="space-y-8">
      {/* 1. Header Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, preferences, and privacy.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* 2. Profile Section */}
          <SettingsCard
            title="Profile Information"
            description="Update your photo and personal details."
            icon={<User />}
            footer={
              <div className="flex justify-end">
                <Button onClick={handleProfileSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                  Save Profile
                </Button>
              </div>
            }
          >
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="flex flex-col items-center flex-shrink-0">
                <Avatar className="h-24 w-24 border-2 border-primary/20">
                  <AvatarImage src={user?.photoURL || userProfile?.profile?.profileImageUrl} alt={displayName} />
                  <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <Button variant="link" className="mt-2 text-xs h-auto p-0">
                  Upload Photo
                </Button>
              </div>
              <div className="space-y-4 flex-grow w-full">
                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user?.email || ''} readOnly disabled />
                  <p className="text-xs text-muted-foreground mt-1">
                    Email cannot be changed after signup.
                  </p>
                </div>
              </div>
            </div>
          </SettingsCard>

          {/* 3. Account Security Section */}
          <SettingsCard
            title="Account Security"
            description="Change your password and manage account security."
            icon={<ShieldCheck />}
          >
            <div className="flex justify-end">
                <Button variant="secondary" onClick={handlePasswordReset}>Send Password Reset Email</Button>
            </div>
          </SettingsCard>
          
          {/* 4. Preferences Section */}
          <SettingsCard
            title="Preferences"
            description="Customize the look and feel of the application."
            icon={<Palette />}
            footer={
              <div className="flex justify-end">
                <Button onClick={handlePreferencesSave} disabled={isSaving}>
                   {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                   Save Preferences
                </Button>
              </div>
            }
          >
            <div className="space-y-6">
                <div>
                    <Label className="font-medium">Theme</Label>
                    <p className="text-sm text-muted-foreground mb-2">Select your preferred interface theme.</p>
                    <ThemeToggle />
                </div>
                 <div>
                    <Label className="font-medium" htmlFor="language">Language</Label>
                     <p className="text-sm text-muted-foreground mb-2">Choose your preferred language.</p>
                    <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger id="language" className="w-full sm:w-[240px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="tw">Twi</SelectItem>
                            <SelectItem value="ew">Ewe</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label className="font-medium">Units</Label>
                    <p className="text-sm text-muted-foreground mb-2">Choose between metric and imperial units.</p>
                     <Tabs value={units} onValueChange={(v) => setUnits(v)} className="w-[180px]">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="metric">Metric</TabsTrigger>
                            <TabsTrigger value="imperial">Imperial</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>
          </SettingsCard>
        </div>

        <div className="lg:col-span-1 space-y-8">
           {/* 5. Notifications Section */}
           <SettingsCard
            title="Notifications"
            description="Manage your notification preferences."
            icon={<Bell />}
            footer={
              <div className="flex justify-end">
                <Button onClick={handlePreferencesSave} disabled={isSaving}>
                   {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                   Save
                </Button>
              </div>
            }
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                <Label htmlFor="daily-reminder" className="cursor-pointer font-normal">Daily Meal Reminder</Label>
                <Switch id="daily-reminder" checked={dailyReminder} onCheckedChange={setDailyReminder} />
              </div>
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                <Label htmlFor="weekly-summary" className="cursor-pointer font-normal">Weekly Nutrition Summary</Label>
                <Switch id="weekly-summary" checked={weeklySummary} onCheckedChange={setWeeklySummary} disabled/>
                <p className="text-xs text-muted-foreground"> (Coming soon)</p>
              </div>
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                <Label htmlFor="goal-alerts" className="cursor-pointer font-normal">Goal Achievement Alerts</Label>
                <Switch id="goal-alerts" checked={goalAlerts} onCheckedChange={setGoalAlerts} disabled/>
                <p className="text-xs text-muted-foreground"> (Coming soon)</p>
              </div>
            </div>
          </SettingsCard>

          {/* 6. Privacy & Data Section */}
          <SettingsCard
            title="Privacy & Data"
            description="Manage your data and privacy settings."
            icon={<FileText />}
          >
            <p className="text-sm text-muted-foreground mb-4">
              Nutrify uses your data to provide personalized nutrition insights. Your data is encrypted and never sold.
            </p>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                View Privacy Policy
              </Button>
              <Button variant="outline" className="w-full justify-start">
                View Terms & Conditions
              </Button>
              <Button variant="secondary" className="w-full justify-start">
                <Download className="mr-2 h-4 w-4" />
                Download My Data
              </Button>
            </div>
          </SettingsCard>
          
          {/* 7. Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full" disabled={isSaving}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete My Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action is permanent and cannot be undone. This will permanently delete your account and remove your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-2 py-2">
                    <Label htmlFor="delete-confirm">Type <strong className="text-foreground">DELETE</strong> to confirm.</Label>
                    <Input
                      id="delete-confirm"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={isDeleteDisabled || isSaving}
                      className="bg-destructive hover:bg-destructive/90"
                      onClick={handleAccountDelete}
                    >
                      {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Delete Permanently
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* 8. Logout Section */}
      <div className="mt-8 pt-6 border-t">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Logout</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to log out?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
      </div>
    </div>
  );
}
