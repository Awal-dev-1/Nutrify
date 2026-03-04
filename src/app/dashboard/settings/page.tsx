
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { updateUserDocument } from '@/services/userService';
import { logout, resetPassword, deleteUserAccount } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  Palette,
  Bell,
  Save,
  AlertTriangle,
  Download,
  Trash2,
  Loader2,
  KeyRound,
  FileBadge,
  LogOut,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { updateProfile } from 'firebase/auth';
import { ThemeToggle } from '@/components/settings/theme-toggle';
import { useTheme } from 'next-themes';


export default function SettingsPage() {
  const { user, userProfile, isProfileLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { setTheme } = useTheme();

  const [displayName, setDisplayName] = useState('');
  const [language, setLanguage] = useState('en');
  const [units, setUnits] = useState('metric');
  const [dailyReminder, setDailyReminder] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.name || '');
      setLanguage(userProfile.preferences?.languagePreference || 'en');
      setUnits(userProfile.preferences?.unitPreference || 'metric');
      setDailyReminder(userProfile.preferences?.reminderEnabled || false);
    }
  }, [userProfile]);

  const handleProfileSave = async () => {
    if (!user || !db || !auth.currentUser) return;
    setIsSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName });
      updateUserDocument(db, user.uid, { name: displayName });
      toast({ title: 'Profile Saved!', description: 'Your display name has been updated.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreferencesSave = () => {
    if (!user || !db) return;
    setIsSaving(true);
    const prefs = {
        'preferences.languagePreference': language,
        'preferences.unitPreference': units,
    };
    updateUserDocument(db, user.uid, prefs);
    toast({ title: 'Preferences Saved!' });
    setIsSaving(false);
  };

  const handleNotificationsSave = () => {
    if (!user || !db) return;
    setIsSaving(true);
    const prefs = {
        'preferences.reminderEnabled': dailyReminder,
    };
    updateUserDocument(db, user.uid, prefs);
    toast({ title: 'Notification Preferences Saved!' });
    setIsSaving(false);
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
      setTheme('system');
      await logout(auth);
      router.push('/');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Logout Failed', description: error.message });
    }
  };

  if (isProfileLoading) {
    return (
      <div className="space-y-6 sm:space-y-8 px-3 sm:px-0">
        <div className="space-y-2">
          <Skeleton className="h-7 sm:h-8 w-48 sm:w-64" />
          <Skeleton className="h-4 sm:h-5 w-64 sm:w-96" />
        </div>
        <Skeleton className="h-72 sm:h-96 w-full" />
      </div>
    );
  }

  const isDeleteDisabled = deleteConfirmText !== 'DELETE';

  return (
    <div className="space-y-6 sm:space-y-8 px-3 sm:px-0 pb-8">

      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-0.5">
          Manage your account, preferences, and privacy.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">

        {/* Tab bar — scrollable on mobile, grid on larger screens */}
        <TabsList className="
          flex w-full overflow-x-auto gap-0.5
          sm:grid sm:grid-cols-5
          h-auto sm:h-10
          p-1 scrollbar-none
        ">
          <TabsTrigger value="profile" className="shrink-0 sm:shrink text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-1.5 flex items-center gap-1 sm:gap-2 whitespace-nowrap">
            <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="shrink-0 sm:shrink text-xs sm:text-sm px-2 sm:px-3 py-1.5 flex items-center gap-1 sm:gap-2 whitespace-nowrap">
            <KeyRound className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span>Account</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="shrink-0 sm:shrink text-xs sm:text-sm px-2 sm:px-3 py-1.5 flex items-center gap-1 sm:gap-2 whitespace-nowrap">
            <Palette className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span>Preferences</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="shrink-0 sm:shrink text-xs sm:text-sm px-2 sm:px-3 py-1.5 flex items-center gap-1 sm:gap-2 whitespace-nowrap">
            <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="shrink-0 sm:shrink text-xs sm:text-sm px-2 sm:px-3 py-1.5 flex items-center gap-1 sm:gap-2 whitespace-nowrap">
            <FileBadge className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span>Privacy</span>
          </TabsTrigger>
        </TabsList>

        {/* ── Profile Tab ── */}
        <TabsContent value="profile" className="mt-4 sm:mt-6">
          <Card>
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
              <CardTitle className="text-base sm:text-lg">Profile Information</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Update your photo and personal details.</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                {/* Avatar */}
                <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-0 sm:flex-shrink-0">
                  <Avatar className="h-16 w-16 sm:h-24 sm:w-24 border-2 border-primary/20">
                    <AvatarImage src={user?.photoURL || userProfile?.profile?.profileImageUrl} alt={displayName} />
                    <AvatarFallback className="text-sm sm:text-base">{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <Button variant="link" className="mt-0 sm:mt-2 text-xs h-auto p-0">
                    Upload Photo
                  </Button>
                </div>
                {/* Fields */}
                <div className="space-y-3 sm:space-y-4 flex-grow w-full min-w-0">
                  <div>
                    <Label htmlFor="displayName" className="text-xs sm:text-sm">Display Name</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="mt-1 h-9 sm:h-10 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
                    <Input id="email" value={user?.email || ''} readOnly disabled className="mt-1 h-9 sm:h-10 text-sm" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Email cannot be changed after signup.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 px-4 sm:px-6 py-3 sm:py-4 border-t flex justify-end">
              <Button onClick={handleProfileSave} disabled={isSaving} size="sm" className="h-9 sm:h-10 text-xs sm:text-sm">
                {isSaving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin"/> : <Save className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                Save Profile
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ── Account Tab ── */}
        <TabsContent value="account" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
              <CardTitle className="text-base sm:text-lg">Account Security</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Change your password and manage account security.</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
              {/* Password Reset */}
              <div className="p-3 sm:p-4 border rounded-lg flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base">Password Reset</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Send a password reset link to your email.</p>
                </div>
                <Button variant="secondary" onClick={handlePasswordReset} className="w-full sm:w-auto shrink-0 h-9 sm:h-10 text-xs sm:text-sm">
                  Send Reset Email
                </Button>
              </div>
              {/* Logout */}
              <div className="p-3 sm:p-4 border rounded-lg flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base">Logout</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">End your current session on this device.</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto shrink-0 h-9 sm:h-10 text-xs sm:text-sm">
                      <LogOut className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Logout
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-md mx-auto rounded-xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Logout</AlertDialogTitle>
                      <AlertDialogDescription>Are you sure you want to log out?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
                      <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
              <CardTitle className="text-base sm:text-lg text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="p-3 sm:p-4 border border-destructive/20 rounded-lg flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base">Delete Account</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Permanently delete your account and all data.</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isSaving} className="w-full sm:w-auto shrink-0 h-9 sm:h-10 text-xs sm:text-sm">
                      <Trash2 className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Delete My Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-md mx-auto rounded-xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action is permanent and cannot be undone. This will permanently delete your account and remove your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2 py-2">
                      <Label htmlFor="delete-confirm" className="text-sm">
                        Type <strong className="text-foreground">DELETE</strong> to confirm.
                      </Label>
                      <Input
                        id="delete-confirm"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                    <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
                      <AlertDialogCancel className="mt-0" onClick={() => setDeleteConfirmText('')}>Cancel</AlertDialogCancel>
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Preferences Tab ── */}
        <TabsContent value="preferences" className="mt-4 sm:mt-6">
          <Card>
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
              <CardTitle className="text-base sm:text-lg">Preferences</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Customize the look and feel of the application.</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-5 sm:space-y-6">
              {/* Theme */}
              <div>
                <Label className="font-medium text-sm sm:text-base">Theme</Label>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">Select your preferred interface theme.</p>
                <ThemeToggle />
              </div>
              {/* Language */}
              <div>
                <Label className="font-medium text-sm sm:text-base" htmlFor="language">Language</Label>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">Choose your preferred language.</p>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language" className="w-full sm:w-[240px] h-9 sm:h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="tw">Twi</SelectItem>
                    <SelectItem value="ew">Ewe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Units */}
              <div>
                <Label className="font-medium text-sm sm:text-base">Units</Label>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">Choose between metric (cm/kg) and imperial (ft/lbs) units. This affects how measurements are displayed across the app.</p>
                <Tabs value={units} onValueChange={(v) => setUnits(v || 'metric')} className="w-[180px]">
                  <TabsList className="grid w-full grid-cols-2 h-9 sm:h-10">
                    <TabsTrigger value="metric" className="text-xs sm:text-sm">Metric</TabsTrigger>
                    <TabsTrigger value="imperial" className="text-xs sm:text-sm">Imperial</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 px-4 sm:px-6 py-3 sm:py-4 border-t flex justify-end">
              <Button onClick={handlePreferencesSave} disabled={isSaving} size="sm" className="h-9 sm:h-10 text-xs sm:text-sm">
                {isSaving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin"/> : <Save className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                Save Preferences
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ── Notifications Tab ── */}
        <TabsContent value="notifications" className="mt-4 sm:mt-6">
          <Card>
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
              <CardTitle className="text-base sm:text-lg">Notifications</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Manage your notification preferences.</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
              {/* Daily Reminder */}
              <div className="flex items-start sm:items-center justify-between gap-3 p-3 sm:p-4 border rounded-lg hover:bg-muted/50">
                <div className="min-w-0 flex-1">
                  <Label htmlFor="daily-reminder" className="cursor-pointer font-medium text-sm sm:text-base">
                    Daily Meal Reminder
                  </Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">Get a daily reminder to log your meals.</p>
                </div>
                <Switch id="daily-reminder" checked={dailyReminder} onCheckedChange={setDailyReminder} className="shrink-0 mt-0.5 sm:mt-0" />
              </div>
              {/* Weekly Summary (disabled) */}
              <div className="flex items-start sm:items-center justify-between gap-3 p-3 sm:p-4 border rounded-lg hover:bg-muted/50 opacity-50 cursor-not-allowed">
                <div className="min-w-0 flex-1">
                  <Label htmlFor="weekly-summary" className="cursor-not-allowed font-medium text-sm sm:text-base">
                    Weekly Nutrition Summary
                  </Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">Receive a summary of your week's nutrition.</p>
                </div>
                <Switch id="weekly-summary" checked={weeklySummary} onCheckedChange={setWeeklySummary} disabled className="shrink-0 mt-0.5 sm:mt-0" />
              </div>
              <p className="text-xs text-muted-foreground text-center">More notification options coming soon!</p>
            </CardContent>
            <CardFooter className="bg-muted/30 px-4 sm:px-6 py-3 sm:py-4 border-t flex justify-end">
              <Button onClick={handleNotificationsSave} disabled={isSaving} size="sm" className="h-9 sm:h-10 text-xs sm:text-sm">
                {isSaving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin"/> : <Save className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                Save Notifications
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ── Privacy Tab ── */}
        <TabsContent value="privacy" className="mt-4 sm:mt-6">
          <Card>
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
              <CardTitle className="text-base sm:text-lg">Privacy & Data</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Manage your data and privacy settings.</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Nutrify uses your data to provide personalized nutrition insights. Your data is encrypted and never sold.
              </p>
              <div className="space-y-2 sm:space-y-3">
                <Button variant="outline" className="w-full justify-start h-9 sm:h-10 text-xs sm:text-sm" asChild>
                  <Link href="/privacy-policy">View Privacy Policy</Link>
                </Button>
                <Button variant="outline" className="w-full justify-start h-9 sm:h-10 text-xs sm:text-sm" asChild>
                  <Link href="/terms-and-conditions">View Terms & Conditions</Link>
                </Button>
                <Button variant="secondary" className="w-full justify-start h-9 sm:h-10 text-xs sm:text-sm">
                  <Download className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  Download My Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
