
'use client';

import { useState } from 'react';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { logout, resetPassword, deleteUserAccount, changeUserPassword } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  AlertTriangle,
  Loader2,
  KeyRound,
  Trash2,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from '@/components/ui/separator';
import { SettingsCard } from '@/components/settings/settings-card';
import { useTheme } from 'next-themes';


const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required." }),
  newPassword: z.string().min(8, { message: "New password must be at least 8 characters." }),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "New passwords do not match.",
  path: ["confirmPassword"]
});

export default function AccountSettingsPage() {
    const { user } = useUser();
    const db = useFirestore();
    const auth = useAuth();
    const { toast } = useToast();
    const { setTheme } = useTheme();

    const [isSaving, setIsSaving] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
        resolver: zodResolver(passwordFormSchema),
        defaultValues: {
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        },
    });

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

    const isDeleteDisabled = deleteConfirmText !== 'DELETE';

    return (
        <div className="space-y-6">
            <SettingsCard
                title="Password & Security"
                description="Manage your password and account access."
                icon={<KeyRound className="h-5 w-5" />}
            >
                <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                        <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => ( <FormItem> <FormLabel>Current Password</FormLabel> <FormControl><Input type="password" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                        <FormField control={passwordForm.control} name="newPassword" render={({ field }) => ( <FormItem> <FormLabel>New Password</FormLabel> <FormControl><Input type="password" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                        <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => ( <FormItem> <FormLabel>Confirm New Password</FormLabel> <FormControl><Input type="password" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2">
                            <Button type="submit" disabled={isChangingPassword}>
                            {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Change Password
                            </Button>
                            <Button type="button" variant="link" onClick={handlePasswordReset} className="text-sm h-auto p-0">Forgot your password?</Button>
                        </div>
                    </form>
                </Form>
                <Separator className="my-6" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div><h3 className="font-medium">Logout</h3><p className="text-sm text-muted-foreground">End your current session on this device.</p></div>
                    <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="outline"><LogOut className="mr-2 h-4 w-4" /> Logout</Button></AlertDialogTrigger>
                    <AlertDialogContent className="w-[90vw] max-w-md rounded-xl"><AlertDialogHeader><AlertDialogTitle>Logout</AlertDialogTitle><AlertDialogDescription>Are you sure you want to log out of your account?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter className="flex-col sm:flex-row gap-2"><AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel><AlertDialogAction onClick={handleLogout} className="w-full sm:w-auto">Logout</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                    </AlertDialog>
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
                    <AlertDialogTrigger asChild><Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete Account</Button></AlertDialogTrigger>
                    <AlertDialogContent className="w-[90vw] max-w-md rounded-xl">
                        <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete your account and remove all your data from our servers.</AlertDialogDescription></AlertDialogHeader>
                        <div className="space-y-3 py-3"><Label htmlFor="delete-confirm" className="text-sm">Type <span className="font-bold">DELETE</span> to confirm</Label><Input id="delete-confirm" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="DELETE" className="h-11"/></div>
                        <AlertDialogFooter className="flex-col sm:flex-row gap-2"><AlertDialogCancel className="w-full sm:w-auto" onClick={() => setDeleteConfirmText('')}>Cancel</AlertDialogCancel><AlertDialogAction disabled={isDeleteDisabled || isSaving} className="w-full sm:w-auto bg-destructive hover:bg-destructive/90" onClick={handleAccountDelete}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete Permanently</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                    </AlertDialog>
                </div>
            </SettingsCard>
        </div>
    );
}
