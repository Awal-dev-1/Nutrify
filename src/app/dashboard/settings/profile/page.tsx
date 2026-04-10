
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { updateUserProfileAndPhoto } from '@/services/profileService';
import { useToast } from '@/hooks/use-toast';
import { User, Save, Loader2, ChevronRight, Upload } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SettingsCard } from '@/components/settings/settings-card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfileSettingsPage() {
  const { user, userProfile, isProfileLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [initialDisplayName, setInitialDisplayName] = useState('');
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userProfile) {
      const name = userProfile.name || '';
      setDisplayName(name);
      setInitialDisplayName(name);
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
      setInitialDisplayName(displayName);
      setProfileImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error Saving Profile', description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (isProfileLoading) {
    return (
      <SettingsCard
        title="Profile Information"
        description="Update your photo and personal details."
        icon={<User className="h-5 w-5" />}
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="flex flex-col items-center gap-2">
                <Skeleton className="h-24 w-24 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-full" />
            </div>
            <div className="flex-1 space-y-4 w-full">
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
            </div>
        </div>
      </SettingsCard>
    );
  }

  return (
    <SettingsCard
      title="Profile Information"
      description="Update your photo and personal details."
      icon={<User className="h-5 w-5" />}
      footer={
        <Button onClick={handleProfileSave} disabled={isSaving || !hasProfileChanges}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Profile Changes
          {hasProfileChanges && <ChevronRight className="ml-2 h-4 w-4" />}
        </Button>
      }
    >
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="flex flex-col items-center gap-2">
          <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-primary/20">
            <AvatarImage src={imagePreview || user?.photoURL || userProfile?.profile?.profileImageUrl} alt={displayName} />
            <AvatarFallback className="text-xl bg-primary/10">{displayName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <Button variant="ghost" size="sm" className="h-8 text-xs rounded-full text-primary hover:bg-primary/10 hover:text-primary" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-3 w-3" />
            Change Photo
          </Button>
          <input ref={fileInputRef} type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={handleImageChange} />
        </div>
        <div className="flex-1 space-y-4 w-full">
          <div>
            <Label htmlFor="displayName" className="text-sm">Display Name</Label>
            <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1 h-11" placeholder="Your name" />
          </div>
          <div>
            <Label htmlFor="email" className="text-sm">Email Address</Label>
            <Input id="email" value={user?.email || ''} readOnly disabled className="mt-1 h-11 bg-muted/50" />
            <p className="text-xs text-muted-foreground mt-1.5">Email cannot be changed after signup.</p>
          </div>
        </div>
      </div>
    </SettingsCard>
  );
}
