
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { updateUserDocument } from '@/services/userService';
import { updateUserProfileAndPhoto } from '@/services/profileService';
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
  ChevronRight,
  Settings,
  Moon,
  Sun,
  Globe,
  Ruler,
  Clock,
  Shield,
  HelpCircle,
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
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function SettingsPage() {
  const { user, userProfile, isProfileLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { setTheme, theme } = useTheme();

  const [displayName, setDisplayName] = useState('');
  const [initialDisplayName, setInitialDisplayName] = useState('');
  const [language, setLanguage] = useState('en');
  const [units, setUnits] = useState('metric');
  const [dailyReminder, setDailyReminder] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userProfile) {
      const name = userProfile.name || '';
      setDisplayName(name);
      setInitialDisplayName(name);
      setLanguage(userProfile.preferences?.languagePreference || 'en');
      setUnits(userProfile.preferences?.unitPreference || 'metric');
      setDailyReminder(userProfile.preferences?.reminderEnabled || false);
      setWeeklySummary(userProfile.preferences?.weeklySummaryEnabled || false);
      setImagePreview(null);
      setProfileImageFile(null);
    }
  }, [userProfile]);

  const hasProfileChanges = useMemo(() => {
    if (isProfileLoading) return false;
    return displayName !== initialDisplayName || profileImageFile !== null;
  }, [displayName, initialDisplayName, profileImageFile, isProfileLoading]);


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast({ variant: 'destructive', title: 'File too large', description: 'Please select an image smaller than 5MB.' });
            return;
        }
        setProfileImageFile(file);
        const objectUrl = URL.createObjectURL(file);
        setImagePreview(objectUrl);
    }
  };

  const handleProfileSave = async () => {
    if (!user || !db || !auth || !hasProfileChanges) return;
    setIsSaving(true);
    try {
      await updateUserProfileAndPhoto(db, auth, displayName, profileImageFile);
      toast({ title: 'Profile Saved!', description: 'Your profile has been successfully updated.' });
      setProfileImageFile(null);
      setImagePreview(null);
      if(fileInputRef.current) fileInputRef.current.value = "";
      // The userProfile hook will cause a re-render with the new data,
      // which will reset initialDisplayName via the useEffect.
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error Saving Profile', description: error.message });
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
      'preferences.weeklySummaryEnabled': weeklySummary,
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
      <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  const isDeleteDisabled = deleteConfirmText !== 'DELETE';

  // Mobile tabs as dropdown
  const TabDropdown = () => (
    <Select value={activeTab} onValueChange={setActiveTab}>
      <SelectTrigger className="w-full h-12 bg-muted/30 border-2">
        <SelectValue>
          <div className="flex items-center gap-2">
            {activeTab === 'profile' && <User className="h-4 w-4" />}
            {activeTab === 'account' && <KeyRound className="h-4 w-4" />}
            {activeTab === 'preferences' && <Palette className="h-4 w-4" />}
            {activeTab === 'notifications' && <Bell className="h-4 w-4" />}
            {activeTab === 'privacy' && <FileBadge className="h-4 w-4" />}
            <span className="capitalize">{activeTab}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="profile">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" /> Profile
          </div>
        </SelectItem>
        <SelectItem value="account">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" /> Account
          </div>
        </SelectItem>
        <SelectItem value="preferences">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4" /> Preferences
          </div>
        </SelectItem>
        <SelectItem value="notifications">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" /> Notifications
          </div>
        </SelectItem>
        <SelectItem value="privacy">
          <div className="flex items-center gap-2">
            <FileBadge className="h-4 w-4" /> Privacy
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4 md:py-6 lg:py-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
            <Settings className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Manage your account, preferences, and privacy.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown - visible only on mobile */}
      <div className="block md:hidden mb-4">
        <TabDropdown />
      </div>

      {/* Desktop Tabs - hidden on mobile */}
      <div className="hidden md:block mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 w-full h-12 p-1">
            <TabsTrigger value="profile" className="text-sm gap-2">
              <User className="h-4 w-4" /> Profile
            </TabsTrigger>
            <TabsTrigger value="account" className="text-sm gap-2">
              <KeyRound className="h-4 w-4" /> Account
            </TabsTrigger>
            <TabsTrigger value="preferences" className="text-sm gap-2">
              <Palette className="h-4 w-4" /> Preferences
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-sm gap-2">
              <Bell className="h-4 w-4" /> Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy" className="text-sm gap-2">
              <FileBadge className="h-4 w-4" /> Privacy
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content Area - changes based on active tab */}
      <div className="space-y-6">
        {/* Profile Tab Content */}
        {activeTab === 'profile' && (
          <Card className="border-2 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <User className="h-5 w-5 text-primary" />
                Profile Information
              </CardTitle>
              <CardDescription className="text-sm">
                Update your photo and personal details.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-4 md:p-6 space-y-6">
              {/* Avatar + Name */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="flex flex-col items-center gap-2">
                  <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-primary/20">
                    <AvatarImage src={imagePreview || user?.photoURL || userProfile?.profile?.profileImageUrl} alt={displayName} />
                    <AvatarFallback className="text-xl bg-primary/10">
                      {displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm" className="h-8 text-xs rounded-full" onClick={() => fileInputRef.current?.click()}>
                    Change Photo
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </div>

                <div className="flex-1 space-y-4 w-full">
                  <div>
                    <Label htmlFor="displayName" className="text-sm">Display Name</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="mt-1 h-11"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm">Email Address</Label>
                    <Input
                      id="email"
                      value={user?.email || ''}
                      readOnly
                      disabled
                      className="mt-1 h-11 bg-muted/50"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Email cannot be changed after signup.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="border-t bg-muted/10 p-4 md:p-6">
              <Button 
                onClick={handleProfileSave} 
                disabled={isSaving || !hasProfileChanges}
                className="w-full sm:w-auto rounded-full px-6"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Profile Changes
                {hasProfileChanges && <ChevronRight className="ml-2 h-4 w-4" />}
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Account Tab Content */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            <Card className="border-2 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <KeyRound className="h-5 w-5 text-primary" />
                  Account Security
                </CardTitle>
                <CardDescription className="text-sm">
                  Manage your password and account access.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-4 md:p-6 space-y-4">
                {/* Password Reset */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg bg-muted/20">
                  <div className="space-y-1">
                    <h3 className="font-medium">Password Reset</h3>
                    <p className="text-sm text-muted-foreground">
                      Send a password reset link to your email.
                    </p>
                  </div>
                  <Button 
                    variant="secondary" 
                    onClick={handlePasswordReset}
                    className="w-full sm:w-auto rounded-full"
                  >
                    Send Reset Email
                  </Button>
                </div>

                {/* Logout */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg">
                  <div className="space-y-1">
                    <h3 className="font-medium">Logout</h3>
                    <p className="text-sm text-muted-foreground">
                      End your current session on this device.
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full sm:w-auto rounded-full">
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="w-[90vw] max-w-md rounded-xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Logout</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to log out of your account?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLogout} className="w-full sm:w-auto">
                          Logout
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-2 border-destructive/20 shadow-lg overflow-hidden">
              <CardHeader className="bg-destructive/5 border-b border-destructive/20 p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-destructive/20 rounded-lg">
                  <div className="space-y-1">
                    <h3 className="font-medium text-destructive">Delete Account</h3>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all associated data.
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full sm:w-auto rounded-full">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="w-[90vw] max-w-md rounded-xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your account
                          and remove all your data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="space-y-3 py-3">
                        <Label htmlFor="delete-confirm" className="text-sm">
                          Type <span className="font-bold">DELETE</span> to confirm
                        </Label>
                        <Input
                          id="delete-confirm"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="DELETE"
                          className="h-11"
                        />
                      </div>
                      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel 
                          className="w-full sm:w-auto"
                          onClick={() => setDeleteConfirmText('')}
                        >
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          disabled={isDeleteDisabled || isSaving}
                          className="w-full sm:w-auto bg-destructive hover:bg-destructive/90"
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
          </div>
        )}

        {/* Preferences Tab Content */}
        {activeTab === 'preferences' && (
          <Card className="border-2 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Palette className="h-5 w-5 text-primary" />
                Preferences
              </CardTitle>
              <CardDescription className="text-sm">
                Customize your app experience.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-4 md:p-6 space-y-6">
              {/* Theme */}
              <div className="space-y-3">
                <Label className="text-base">Theme</Label>
                <div className="flex gap-2">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('light')}
                    className="flex-1 rounded-full"
                  >
                    <Sun className="mr-2 h-4 w-4" /> Light
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('dark')}
                    className="flex-1 rounded-full"
                  >
                    <Moon className="mr-2 h-4 w-4" /> Dark
                  </Button>
                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('system')}
                    className="flex-1 rounded-full"
                  >
                    System
                  </Button>
                </div>
              </div>

              {/* Language */}
              <div className="space-y-3">
                <Label htmlFor="language" className="text-base">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="tw">Twi (Ghana)</SelectItem>
                    <SelectItem value="ew">Ewe (Ghana)</SelectItem>
                    <SelectItem value="ha">Hausa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Units */}
              <div className="space-y-3">
                <Label className="text-base">Measurement Units</Label>
                <div className="flex gap-2">
                  <Button
                    variant={units === 'metric' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setUnits('metric')}
                    className="flex-1 rounded-full"
                  >
                    <Ruler className="mr-2 h-4 w-4" /> Metric
                  </Button>
                  <Button
                    variant={units === 'imperial' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setUnits('imperial')}
                    className="flex-1 rounded-full"
                  >
                    Imperial
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Metric: cm, kg • Imperial: ft, lbs
                </p>
              </div>
            </CardContent>

            <CardFooter className="border-t bg-muted/10 p-4 md:p-6">
              <Button 
                onClick={handlePreferencesSave} 
                disabled={isSaving}
                className="w-full sm:w-auto rounded-full px-6"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Preferences
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Notifications Tab Content */}
        {activeTab === 'notifications' && (
          <Card className="border-2 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Bell className="h-5 w-5 text-primary" />
                Notifications
              </CardTitle>
              <CardDescription className="text-sm">
                Control how and when we notify you.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-4 md:p-6 space-y-4">
              {/* Daily Reminder */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1 pr-4">
                  <Label htmlFor="daily-reminder" className="text-base font-medium">
                    Daily Meal Reminder
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get a daily reminder to log your meals
                  </p>
                </div>
                <Switch
                  id="daily-reminder"
                  checked={dailyReminder}
                  onCheckedChange={setDailyReminder}
                />
              </div>

              {/* Weekly Summary */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1 pr-4">
                  <Label htmlFor="weekly-summary" className="text-base font-medium">
                    Weekly Nutrition Summary
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a summary of your week's nutrition by email.
                  </p>
                </div>
                <Switch
                  id="weekly-summary"
                  checked={weeklySummary}
                  onCheckedChange={setWeeklySummary}
                />
              </div>
            </CardContent>

            <CardFooter className="border-t bg-muted/10 p-4 md:p-6">
              <Button 
                onClick={handleNotificationsSave} 
                disabled={isSaving}
                className="w-full sm:w-auto rounded-full px-6"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Notification Settings
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Privacy Tab Content */}
        {activeTab === 'privacy' && (
          <Card className="border-2 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <FileBadge className="h-5 w-5 text-primary" />
                Privacy & Data
              </CardTitle>
              <CardDescription className="text-sm">
                Manage your data and privacy settings.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-4 md:p-6 space-y-4">
              <p className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
                Nutrify uses your data to provide personalized nutrition insights. 
                Your data is encrypted and never sold to third parties.
              </p>

              <div className="space-y-3 pt-2">
                <Button variant="outline" className="w-full justify-start h-11 rounded-full" asChild>
                  <Link href="/privacy-policy">
                    <Shield className="mr-2 h-4 w-4" /> View Privacy Policy
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start h-11 rounded-full" asChild>
                  <Link href="/terms-and-conditions">
                    <FileBadge className="mr-2 h-4 w-4" /> View Terms & Conditions
                  </Link>
                </Button>
                <Button variant="secondary" className="w-full justify-start h-11 rounded-full">
                  <Download className="mr-2 h-4 w-4" /> Download My Data
                </Button>
                <Button variant="ghost" className="w-full justify-start h-11 rounded-full">
                  <HelpCircle className="mr-2 h-4 w-4" /> Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
