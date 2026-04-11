
'use client';

import { useState } from 'react';
import { useUser, useAuth, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { FileBadge, Download, AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SettingsCard } from '@/components/settings/settings-card';
import { deleteUserAccount } from '@/services/authService';
import Link from 'next/link';
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

export default function PrivacySettingsPage() {
    const { userProfile } = useUser();
    const { toast } = useToast();
    const auth = useAuth();
    const db = useFirestore();
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    const formatDataAsDoc = (profile: any): string => {
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
        content += `Gender: ${profile.profile?.gender || 'N/A'}\n`;
        content += `Age: ${profile.profile?.age || 'N/A'}\n`;
        content += `Height: ${profile.profile?.heightCm || 'N/A'} cm\n`;
        content += `Weight: ${profile.profile?.weightKg || 'N/A'} kg\n`;
        content += `Activity Level: ${profile.profile?.activityLevel || 'N/A'}\n`;
        content += `Profile Image URL: ${profile.profile?.profileImageUrl || 'N/A'}\n`;
        content += `\n`;
    
        content += `--- Health Goals ---\n`;
        content += `Primary Goal: ${profile.health?.primaryGoal || 'N/A'}\n`;
        content += `Dietary Preferences: ${(profile.health?.dietaryPreferences || []).join(', ') || 'None'}\n`;
        content += `\n`;
    
        content += `--- Nutritional Goals ---\n`;
        content += `Daily Calorie Goal: ${profile.goals?.dailyCalorieGoal || 'N/A'} kcal\n`;
        content += `Protein Goal: ${profile.goals?.proteinPercentageGoal || 'N/A'}%\n`;
        content += `Carbs Goal: ${profile.goals?.carbsPercentageGoal || 'N/A'}%\n`;
        content += `Fat Goal: ${profile.goals?.fatPercentageGoal || 'N/A'}%\n`;
        content += `\n`;
        
        content += `--- Preferences ---\n`;
        content += `Theme: ${profile.preferences?.themePreference || 'N/A'}\n`;
        content += `Units: ${profile.preferences?.unitPreference || 'N/A'}\n`;
        content += `Language: ${profile.preferences?.languagePreference || 'N/A'}\n`;
        content += `Daily Reminders: ${profile.preferences?.reminderEnabled ? 'Enabled' : 'Disabled'}\n`;
        content += `Weekly Summary: ${profile.preferences?.weeklySummaryEnabled ? 'Enabled' : 'Disabled'}\n`;
    
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

    const handleAccountDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteUserAccount(auth, db);
            toast({ title: 'Account Deletion Initiated', description: 'Your account is being deleted. You have been logged out.' });
            window.location.assign('/');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message, duration: 10000 });
            setIsDeleting(false);
        }
    };

    const isDeleteDisabled = deleteConfirmText !== 'DELETE';
    
    return (
        <div className="space-y-6">
            <AnimatePresence>
              {isDeleting && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
                >
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="mt-4 text-lg font-medium">Initiating Deletion...</p>
                  <p className="text-sm text-muted-foreground">You will be logged out and redirected shortly.</p>
                </motion.div>
              )}
            </AnimatePresence>
            
            <SettingsCard
                title="Privacy & Data"
                description="Manage your data and privacy settings."
                icon={<FileBadge className="h-5 w-5" />}
            >
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">Nutrify uses your data to provide personalized nutrition insights. Your data is encrypted and never sold to third parties.</p>
                    <div className="space-y-3 pt-2">
                        <Button variant="outline" className="w-full justify-start h-11 rounded-lg" asChild>
                            <Link href="/privacy-policy" target="_blank" rel="noopener noreferrer">
                                <FileBadge className="mr-2 h-4 w-4" /> View Privacy Policy
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-start h-11 rounded-lg" asChild>
                            <Link href="/terms-and-conditions" target="_blank" rel="noopener noreferrer">
                                <FileBadge className="mr-2 h-4 w-4" /> View Terms & Conditions
                            </Link>
                        </Button>
                        <Button variant="secondary" className="w-full justify-start h-11 rounded-lg" onClick={handleDownloadData}>
                            <Download className="mr-2 h-4 w-4" /> Download My Data
                        </Button>
                    </div>
                </div>
            </SettingsCard>

            <SettingsCard
                title="Danger Zone"
                description="Manage irreversible account actions."
                icon={<AlertTriangle className="h-5 w-5" />}
            >
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                    <div className="space-y-1"><h3 className="font-medium text-destructive">Delete Account</h3><p className="text-sm text-muted-foreground">Permanently delete your account and all associated data.</p></div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="w-[90vw] max-w-md rounded-xl">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                This action is irreversible. All your data will be permanently deleted in the background.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="space-y-3 py-3">
                                <Label htmlFor="delete-confirm" className="text-sm">Type <span className="font-bold">DELETE</span> to confirm</Label>
                                <Input id="delete-confirm" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="DELETE" className="h-11"/>
                            </div>
                            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                <AlertDialogCancel className="w-full sm:w-auto" onClick={() => setDeleteConfirmText('')}>Cancel</AlertDialogCancel>
                                <AlertDialogAction disabled={isDeleteDisabled} className="w-full sm:w-auto bg-destructive hover:bg-destructive/90" onClick={handleAccountDelete}>
                                    Delete Account
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </SettingsCard>
        </div>
    );
}
