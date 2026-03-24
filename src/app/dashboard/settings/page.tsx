
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser, useFirestore, useAuth, type UserProfile } from '@/firebase';
import { updateUserDocument } from '@/services/userService';
import { updateUserProfileAndPhoto } from '@/services/profileService';
import { logout, resetPassword, deleteUserAccount, changeUserPassword } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
  Laptop,
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from '@/components/ui/separator';

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required." }),
  newPassword: z.string().min(8, { message: "New password must be at least 8 characters." }),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "New passwords do not match.",
  path: ["confirmPassword"]
});

const navItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'account', label: 'Account', icon: KeyRound },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Data', icon: FileBadge },
];

export default function SettingsPage() {
  const { user, userProfile, isProfileLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { setTheme, theme } = useTheme();

  // Current State
  const [displayName, setDisplayName] = useState('');
  const [language, setLanguage] = useState('en');
  const [units, setUnits] = useState('metric');
  const [dailyReminder, setDailyReminder] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Initial State for Change Detection
  const [initialDisplayName, setInitialDisplayName] = useState('');
  const [initialLanguage, setInitialLanguage] = useState('en');
  const [initialUnits, setInitialUnits] = useState('metric');
  const [initialDailyReminder, setInitialDailyReminder] = useState(false);
  const [initialWeeklySummary, setInitialWeeklySummary] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (userProfile) {
      const name = userProfile.name || '';
      setDisplayName(name);
      setInitialDisplayName(name);

      const lang = userProfile.preferences?.languagePreference || 'en';
      setLanguage(lang);
      setInitialLanguage(lang);

      const unitsPref = userProfile.preferences?.unitPreference || 'metric';
      setUnits(unitsPref);
      setInitialUnits(unitsPref);

      const daily = userProfile.preferences?.reminderEnabled || false;
      setDailyReminder(daily);
      setInitialDailyReminder(daily);

      const weekly = userProfile.preferences?.weeklySummaryEnabled || false;
      setWeeklySummary(weekly);
      setInitialWeeklySummary(weekly);

      setImagePreview(null);
      setProfileImageFile(null);
    }
  }, [userProfile]);

  const hasProfileChanges = useMemo(() => {
    if (isProfileLoading) return false;
    return displayName !== initialDisplayName || profileImageFile !== null;
  }, [displayName, initialDisplayName, profileImageFile, isProfileLoading]);

  const hasPreferencesChanges = useMemo(() => {
    if (isProfileLoading) return false;
    return language !== initialLanguage || units !== initialUnits;
  }, [language, initialLanguage, units, initialUnits, isProfileLoading]);

  const hasNotificationsChanges = useMemo(() => {
    if (isProfileLoading) return false;
    return dailyReminder !== initialDailyReminder || weeklySummary !== initialWeeklySummary;
  }, [dailyReminder, initialDailyReminder, weeklySummary, initialWeeklySummary, isProfileLoading]);

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

  const handleProfileSave = async () => {
    if (!user || !db || !auth || !hasProfileChanges) return;
    setIsSaving(true);
    try {
      await updateUserProfileAndPhoto(db, auth, displayName, profileImageFile);
      toast({ title: 'Profile Saved!', description: 'Your profile has been successfully updated.' });
      setInitialDisplayName(displayName);
      setProfileImageFile(null);
      setImagePreview(null);
      if(fileInputRef.current) fileInputRef.current.value = "";
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error Saving Profile', description: error.message });
    } finally {
      setIsSaving(false);
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
  
  const onPasswordSubmit = async (values: z.infer<typeof passwordFormSchema>) => {
    setIsChangingPassword(true);
    try {
      await changeUserPassword(auth, values.currentPassword, values.newPassword);
      toast({ title: "Password Changed", description: "Your password has been successfully updated." });
      passwordForm.reset();
    } catch (error: any) {
      let description = "An unexpected error occurred.";
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        description = "The current password you entered is incorrect. Please try again.";
        passwordForm.setError("currentPassword", { type: "manual", message: "Incorrect password" });
      } else {
        description = error.message || description;
      }
      toast({ variant: "destructive", title: "Password Change Failed", description });
    } finally {
      setIsChangingPassword(false);
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
      toast({ title: 'Account Deleted', description: 'Your account has been permanently deleted.' });
      window.location.assign('/');
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
      window.location.assign('/');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Logout Failed', description: error.message });
    }
  };

  const formatDataAsDoc = (profile: UserProfile): string => {
    let content = `Nutrify User Data Export\n`;
    content += `=========================\n\n`;
    content += `User ID: ${profile.id}\n`;
    content += `Name: ${profile.name}\n`;
    content += `Email: ${profile.email}\n`;
    content += `Onboarding Completed: ${profile.onboardingCompleted}\n`;
    
    const createdAtDate = profile.createdAt?.toDate ? profile.createdAt.toDate() : (profile.createdAt ? new Date(profile.createdAt) : null);
    const updatedAtDate = profile.updatedAt?.toDate ? profile.updatedAt.toDate() : (profile.updatedAt ? new Date(profile.updatedAt) : null);

    content += `Created At: ${createdAtDate ? createdAtDate.toLocaleString() : 'N/A'}\n`;
    content += `Updated At: ${updatedAtDate ? updatedAtDate.toLocaleString() : 'N/A'}\n\n`;

    content += `--- Profile ---\n`;
    if (profile.profile) {
        content += `Gender: ${profile.profile.gender || 'N/A'}\n`;
        content += `Age: ${profile.profile.age || 'N/A'}\n`;
        content += `Height: ${profile.profile.heightCm || 'N/A'} cm\n`;
        content += `Weight: ${profile.profile.weightKg || 'N/A'} kg\n`;
        content += `Activity Level: ${profile.profile.activityLevel || 'N/A'}\n`;
        content += `Profile Image URL: ${profile.profile.profileImageUrl || 'N/A'}\n`;
    } else {
        content += `No profile data.\n`;
    }
    content += `\n`;

    content += `--- Health Goals ---\n`;
    if (profile.health) {
        content += `Primary Goal: ${profile.health.primaryGoal || 'N/A'}\n`;
        content += `Dietary Preferences: ${(profile.health.dietaryPreferences || []).join(', ') || 'None'}\n`;
    } else {
        content += `No health data.\n`;
    }
    content += `\n`;

    content += `--- Nutritional Goals ---\n`;
    if (profile.goals) {
        content += `Daily Calorie Goal: ${profile.goals.dailyCalorieGoal || 'N/A'} kcal\n`;
        content += `Protein Goal: ${profile.goals.proteinPercentageGoal || 'N/A'}%\n`;
        content += `Carbs Goal: ${profile.goals.carbsPercentageGoal || 'N/A'}%\n`;
        content += `Fat Goal: ${profile.goals.fatPercentageGoal || 'N/A'}%\n`;
    } else {
        content += `No nutritional goals set.\n`;
    }
    content += `\n`;
    
    content += `--- Preferences ---\n`;
    if (profile.preferences) {
        content += `Theme: ${profile.preferences.themePreference || 'N/A'}\n`;
        content += `Units: ${profile.preferences.unitPreference || 'N/A'}\n`;
        content += `Language: ${profile.preferences.languagePreference || 'N/A'}\n`;
        content += `Daily Reminders: ${profile.preferences.reminderEnabled ? 'Enabled' : 'Disabled'}\n`;
        content += `Weekly Summary: ${profile.preferences.weeklySummaryEnabled ? 'Enabled' : 'Disabled'}\n`;
    } else {
        content += `No preferences set.\n`;
    }

    return content;
  }

  const handleDownloadData = () => {
    if (!userProfile) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not find profile data to download.',
      });
      return;
    }
    try {
      const dataStr = formatDataAsDoc(userProfile);
      const blob = new Blob([dataStr], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nutrify_data_${userProfile.id}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({
        title: 'Download Started',
        description: 'Your data is being downloaded as a document.',
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: 'An unexpected error occurred while preparing your data.',
      });
    }
  };

  if (isProfileLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  const isDeleteDisabled = deleteConfirmText !== 'DELETE';

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-4 md:py-6 lg:py-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
            <Settings className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-h1 font-bold text-primary">Settings</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Manage your account, preferences, and privacy.
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <div className="w-full overflow-x-auto pb-2">
          <TabsList className="grid w-max min-w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {navItems.map(item => (
              <TabsTrigger key={item.id} value={item.id} className="h-auto py-2 sm:py-2.5 flex-row gap-2">
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="mt-6">
          <TabsContent value="profile">
            <Card className="border-2 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl"><User className="h-5 w-5 text-primary" />Profile Information</CardTitle>
                <CardDescription className="text-sm">Update your photo and personal details.</CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  <div className="flex flex-col items-center gap-2">
                    <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-primary/20">
                      <AvatarImage src={imagePreview || user?.photoURL || userProfile?.profile?.profileImageUrl} alt={displayName} />
                      <AvatarFallback className="text-xl bg-primary/10">{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <Button variant="outline" size="sm" className="h-8 text-xs rounded-full" onClick={() => fileInputRef.current?.click()}>Change Photo</Button>
                    <input ref={fileInputRef} type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={handleImageChange}/>
                  </div>
                  <div className="flex-1 space-y-4 w-full">
                    <div>
                      <Label htmlFor="displayName" className="text-sm">Display Name</Label>
                      <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1 h-11" placeholder="Your name"/>
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm">Email Address</Label>
                      <Input id="email" value={user?.email || ''} readOnly disabled className="mt-1 h-11 bg-muted/50"/>
                      <p className="text-xs text-muted-foreground mt-1.5">Email cannot be changed after signup.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/10 p-4 md:p-6">
                <Button onClick={handleProfileSave} disabled={isSaving || !hasProfileChanges} className="w-full sm:w-auto rounded-full px-6">
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Profile Changes
                  {hasProfileChanges && <ChevronRight className="ml-2 h-4 w-4" />}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="account">
            <div className="space-y-6">
              <Card className="border-2 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b p-4 md:p-6">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl"><KeyRound className="h-5 w-5 text-primary" />Password & Security</CardTitle>
                  <CardDescription className="text-sm">Manage your password and account access.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6 space-y-6">
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                      <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => ( <FormItem> <FormLabel>Current Password</FormLabel> <FormControl><Input type="password" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                      <FormField control={passwordForm.control} name="newPassword" render={({ field }) => ( <FormItem> <FormLabel>New Password</FormLabel> <FormControl><Input type="password" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                      <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => ( <FormItem> <FormLabel>Confirm New Password</FormLabel> <FormControl><Input type="password" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2">
                        <Button type="submit" disabled={isChangingPassword} className="w-full sm:w-auto rounded-full">
                          {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Change Password
                        </Button>
                        <Button type="button" variant="link" onClick={handlePasswordReset} className="text-sm h-auto p-0">Forgot your password?</Button>
                      </div>
                    </form>
                  </Form>
                  <Separator />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div><h3 className="font-medium">Logout</h3><p className="text-sm text-muted-foreground">End your current session on this device.</p></div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="outline" className="w-full sm:w-auto rounded-full"><LogOut className="mr-2 h-4 w-4" /> Logout</Button></AlertDialogTrigger>
                      <AlertDialogContent className="w-[90vw] max-w-md rounded-xl"><AlertDialogHeader><AlertDialogTitle>Logout</AlertDialogTitle><AlertDialogDescription>Are you sure you want to log out of your account?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter className="flex-col sm:flex-row gap-2"><AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel><AlertDialogAction onClick={handleLogout} className="w-full sm:w-auto">Logout</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2 border-destructive/20 shadow-lg overflow-hidden">
                <CardHeader className="bg-destructive/5 border-b border-destructive/20 p-4 md:p-6">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl text-destructive"><AlertTriangle className="h-5 w-5" /> Danger Zone</CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-destructive/20 rounded-lg">
                    <div className="space-y-1"><h3 className="font-medium text-destructive">Delete Account</h3><p className="text-sm text-muted-foreground">Permanently delete your account and all associated data.</p></div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="destructive" className="w-full sm:w-auto rounded-full"><Trash2 className="mr-2 h-4 w-4" /> Delete Account</Button></AlertDialogTrigger>
                      <AlertDialogContent className="w-[90vw] max-w-md rounded-xl">
                        <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete your account and remove all your data from our servers.</AlertDialogDescription></AlertDialogHeader>
                        <div className="space-y-3 py-3"><Label htmlFor="delete-confirm" className="text-sm">Type <span className="font-bold">DELETE</span> to confirm</Label><Input id="delete-confirm" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="DELETE" className="h-11"/></div>
                        <AlertDialogFooter className="flex-col sm:flex-row gap-2"><AlertDialogCancel className="w-full sm:w-auto" onClick={() => setDeleteConfirmText('')}>Cancel</AlertDialogCancel><AlertDialogAction disabled={isDeleteDisabled || isSaving} className="w-full sm:w-auto bg-destructive hover:bg-destructive/90" onClick={handleAccountDelete}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete Permanently</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="preferences">
            <Card className="border-2 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b p-4 md:p-6"><CardTitle className="flex items-center gap-2 text-lg md:text-xl"><Palette className="h-5 w-5 text-primary" />Preferences</CardTitle><CardDescription className="text-sm">Customize your app experience.</CardDescription></CardHeader>
              <CardContent className="p-4 md:p-6 space-y-6">
                <div className="space-y-3"><Label className="text-base">Theme</Label><Tabs value={theme} onValueChange={handleThemeChange} className="w-full"><TabsList className="grid w-full grid-cols-3 h-auto p-1.5"><TabsTrigger value="light" className="flex flex-col items-center gap-1.5 p-2 h-full"><Sun className="h-5 w-5" /> Light</TabsTrigger><TabsTrigger value="dark" className="flex flex-col items-center gap-1.5 p-2 h-full"><Moon className="h-5 w-5" /> Dark</TabsTrigger><TabsTrigger value="system" className="flex flex-col items-center gap-1.5 p-2 h-full"><Laptop className="h-5 w-5" /> System</TabsTrigger></TabsList></Tabs></div>
                <div className="space-y-3"><Label htmlFor="language" className="text-base">Language</Label><Select value={language} onValueChange={setLanguage}><SelectTrigger id="language" className="h-11"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="tw">Twi (Ghana)</SelectItem><SelectItem value="ew">Ewe (Ghana)</SelectItem><SelectItem value="ha">Hausa</SelectItem></SelectContent></Select></div>
                <div className="space-y-3"><Label className="text-base">Measurement Units</Label><div className="flex gap-2"><Button variant={units === 'metric' ? 'default' : 'outline'} size="sm" onClick={() => setUnits('metric')} className="flex-1 rounded-full"><Ruler className="mr-2 h-4 w-4" /> Metric</Button><Button variant={units === 'imperial' ? 'default' : 'outline'} size="sm" onClick={() => setUnits('imperial')} className="flex-1 rounded-full">Imperial</Button></div><p className="text-xs text-muted-foreground">Metric: cm, kg • Imperial: ft, lbs</p></div>
              </CardContent>
              <CardFooter className="border-t bg-muted/10 p-4 md:p-6"><Button onClick={handlePreferencesSave} disabled={isSaving || !hasPreferencesChanges} className="w-full sm:w-auto rounded-full px-6">{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save Preferences</Button></CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card className="border-2 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b p-4 md:p-6"><CardTitle className="flex items-center gap-2 text-lg md:text-xl"><Bell className="h-5 w-5 text-primary" />Notifications</CardTitle><CardDescription className="text-sm">Control how and when we notify you.</CardDescription></CardHeader>
              <CardContent className="p-4 md:p-6 space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg"><div className="space-y-1 pr-4"><Label htmlFor="daily-reminder" className="text-base font-medium">Daily Meal Reminder</Label><p className="text-sm text-muted-foreground">Get a daily reminder to log your meals</p></div><Switch id="daily-reminder" checked={dailyReminder} onCheckedChange={setDailyReminder}/></div>
                <div className="flex items-center justify-between p-4 border rounded-lg"><div className="space-y-1 pr-4"><Label htmlFor="weekly-summary" className="text-base font-medium">Weekly Nutrition Summary</Label><p className="text-sm text-muted-foreground">Receive a summary of your week's nutrition by email.</p></div><Switch id="weekly-summary" checked={weeklySummary} onCheckedChange={setWeeklySummary}/></div>
              </CardContent>
              <CardFooter className="border-t bg-muted/10 p-4 md:p-6"><Button onClick={handleNotificationsSave} disabled={isSaving || !hasNotificationsChanges} className="w-full sm:w-auto rounded-full px-6">{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save Notification Settings</Button></CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="privacy">
            <Card className="border-2 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b p-4 md:p-6"><CardTitle className="flex items-center gap-2 text-lg md:text-xl"><FileBadge className="h-5 w-5 text-primary" />Privacy & Data</CardTitle><CardDescription className="text-sm">Manage your data and privacy settings.</CardDescription></CardHeader>
              <CardContent className="p-4 md:p-6 space-y-4">
                <p className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">Nutrify uses your data to provide personalized nutrition insights. Your data is encrypted and never sold to third parties.</p>
                <div className="space-y-3 pt-2">
                  <Button variant="outline" className="w-full justify-start h-11 rounded-full" asChild><Link href="/privacy-policy"><Shield className="mr-2 h-4 w-4" /> View Privacy Policy</Link></Button>
                  <Button variant="outline" className="w-full justify-start h-11 rounded-full" asChild><Link href="/terms-and-conditions"><FileBadge className="mr-2 h-4 w-4" /> View Terms & Conditions</Link></Button>
                  <Button variant="secondary" className="w-full justify-start h-11 rounded-full" onClick={handleDownloadData}><Download className="mr-2 h-4 w-4" /> Download My Data</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
