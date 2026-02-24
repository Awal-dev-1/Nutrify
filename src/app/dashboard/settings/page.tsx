'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockUser } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
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

export default function SettingsPage() {
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(mockUser.name);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleProfileSave = () => {
    toast({
      title: 'Profile Saved!',
      description: 'Your display name has been updated.',
    });
  };

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
                <Button onClick={handleProfileSave}>
                  <Save className="mr-2 h-4 w-4" /> Save Profile
                </Button>
              </div>
            }
          >
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="flex flex-col items-center flex-shrink-0">
                <Avatar className="h-24 w-24 border-2 border-primary/20">
                  <AvatarImage src={mockUser.profilePictureUrl} alt={displayName} />
                  <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
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
                  <Input id="email" value={mockUser.email} readOnly disabled />
                  <p className="text-xs text-muted-foreground mt-1">
                    To change email, go to Account Security.
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
            <div className="space-y-6">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" placeholder="••••••••" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" placeholder="••••••••" />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input id="confirmPassword" type="password" placeholder="••••••••" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="secondary">Change Password</Button>
              </div>
            </div>
          </SettingsCard>
          
          {/* 4. Preferences Section */}
          <SettingsCard
            title="Preferences"
            description="Customize the look and feel of the application."
            icon={<Palette />}
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
                    <Select defaultValue="en">
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
                     <Tabs defaultValue="metric" className="w-[180px]">
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
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                <Label htmlFor="daily-reminder" className="cursor-pointer font-normal">Daily Meal Reminder</Label>
                <Switch id="daily-reminder" defaultChecked />
              </div>
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                <Label htmlFor="weekly-summary" className="cursor-pointer font-normal">Weekly Nutrition Summary</Label>
                <Switch id="weekly-summary" defaultChecked />
              </div>
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                <Label htmlFor="goal-alerts" className="cursor-pointer font-normal">Goal Achievement Alerts</Label>
                <Switch id="goal-alerts" />
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
                  <Button variant="destructive" className="w-full">
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
                      disabled={isDeleteDisabled}
                      className="bg-destructive hover:bg-destructive/90"
                      onClick={() => toast({variant: "destructive", title: "Account Deletion Initiated", description: "Your account will be deleted."})}
                    >
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
                <AlertDialogAction>Logout</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
      </div>
    </div>
  );
}
