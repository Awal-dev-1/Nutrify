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


export default function SettingsPage() {
  const { user, userProfile, isProfileLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // State for form fields
  const [displayName, setDisplayName] = useState('');
  const [language, setLanguage] = useState('en');
  const [units, setUnits] = useState('metric');
  const [dailyReminder, setDailyReminder] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Initialize state from userProfile
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
        };
        await updateUserDocument(db, user.uid, prefs);
        toast({ title: 'Preferences Saved!' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error saving preferences', description: error.message });
    } finally {
        setIsSaving(false);
    }
  };

  const handleNotificationsSave = async () => {
    if (!user || !db) return;
    setIsSaving(true);
    try {
        const prefs = {
            'preferences.reminderEnabled': dailyReminder,
        };
        await updateUserDocument(db, user.uid, prefs);
        toast({ title: 'Notification Preferences Saved!' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error saving notifications', description: error.message });
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
        <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-96 w-full" />
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

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
            <TabsTrigger value="profile"><User className="mr-2 h-4 w-4"/>Profile</TabsTrigger>
            <TabsTrigger value="account"><KeyRound className="mr-2 h-4 w-4"/>Account</TabsTrigger>
            <TabsTrigger value="preferences"><Palette className="mr-2 h-4 w-4"/>Preferences</TabsTrigger>
            <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4"/>Notifications</TabsTrigger>
            <TabsTrigger value="privacy"><FileBadge className="mr-2 h-4 w-4"/>Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Update your photo and personal details.</CardDescription>
                </CardHeader>
                <CardContent>
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
                </CardContent>
                <CardFooter className="bg-muted/30 p-4 border-t flex justify-end">
                    <Button onClick={handleProfileSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                        Save Profile
                    </Button>
                </CardFooter>
            </Card>
        </TabsContent>

        <TabsContent value="account" className="mt-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Account Security</CardTitle>
                    <CardDescription>Change your password and manage account security.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="p-4 border rounded-lg flex items-center justify-between">
                         <div>
                            <p className="font-medium">Password Reset</p>
                            <p className="text-sm text-muted-foreground">Send a password reset link to your email.</p>
                         </div>
                        <Button variant="secondary" onClick={handlePasswordReset}>Send Reset Email</Button>
                    </div>
                     <div className="p-4 border rounded-lg flex items-center justify-between">
                         <div>
                            <p className="font-medium">Logout</p>
                            <p className="text-sm text-muted-foreground">End your current session on this device.</p>
                         </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                            <Button variant="outline">
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
                </CardContent>
            </Card>
            
            <Card className="border-destructive/50">
                <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                    <AlertTriangle />
                    Danger Zone
                </CardTitle>
                </CardHeader>
                <CardContent>
                <div className="p-4 border border-destructive/20 rounded-lg flex items-center justify-between">
                    <div>
                        <p className="font-medium">Delete Account</p>
                        <p className="text-sm text-muted-foreground">Permanently delete your account and all data.</p>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={isSaving}>
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
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="preferences" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                    <CardDescription>Customize the look and feel of the application.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                        <Tabs value={units} onValueChange={(v) => setUnits(v || 'metric')} className="w-[180px]">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="metric">Metric</TabsTrigger>
                                <TabsTrigger value="imperial">Imperial</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </CardContent>
                 <CardFooter className="bg-muted/30 p-4 border-t flex justify-end">
                    <Button onClick={handlePreferencesSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                        Save Preferences
                    </Button>
                </CardFooter>
            </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>Manage your notification preferences.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                        <div>
                            <Label htmlFor="daily-reminder" className="cursor-pointer font-medium">Daily Meal Reminder</Label>
                            <p className="text-sm text-muted-foreground">Get a daily reminder to log your meals.</p>
                        </div>
                        <Switch id="daily-reminder" checked={dailyReminder} onCheckedChange={setDailyReminder} />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 opacity-50 cursor-not-allowed">
                        <div>
                            <Label htmlFor="weekly-summary" className="cursor-not-allowed font-medium">Weekly Nutrition Summary</Label>
                            <p className="text-sm text-muted-foreground">Receive a summary of your week's nutrition.</p>
                        </div>
                        <Switch id="weekly-summary" checked={weeklySummary} onCheckedChange={setWeeklySummary} disabled/>
                    </div>
                     <p className="text-xs text-muted-foreground text-center">More notification options coming soon!</p>
                </CardContent>
                 <CardFooter className="bg-muted/30 p-4 border-t flex justify-end">
                    <Button onClick={handleNotificationsSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                        Save Notifications
                    </Button>
                </CardFooter>
            </Card>
        </TabsContent>

        <TabsContent value="privacy" className="mt-6">
             <Card>
                <CardHeader>
                    <CardTitle>Privacy & Data</CardTitle>
                    <CardDescription>Manage your data and privacy settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                    Nutrify uses your data to provide personalized nutrition insights. Your data is encrypted and never sold.
                    </p>
                    <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" asChild>
                        <Link href="/privacy-policy">View Privacy Policy</Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                        <Link href="/terms-and-conditions">View Terms & Conditions</Link>
                    </Button>
                    <Button variant="secondary" className="w-full justify-start">
                        <Download className="mr-2 h-4 w-4" />
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
