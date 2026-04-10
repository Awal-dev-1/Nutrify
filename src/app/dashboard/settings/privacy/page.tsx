
'use client';

import { useUser, type UserProfile } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { FileBadge, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SettingsCard } from '@/components/settings/settings-card';
import Link from 'next/link';

export default function PrivacySettingsPage() {
    const { userProfile } = useUser();
    const { toast } = useToast();

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
    
    return (
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
    );
}
