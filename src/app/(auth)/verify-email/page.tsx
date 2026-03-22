
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@/firebase';
import { resendVerificationEmail, logout } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MailCheck, LogOut } from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { motion } from 'framer-motion';

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Main redirect logic
  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    const isPasswordProvider = user.providerData.some(p => p.providerId === 'password');
    if (user.emailVerified || !isPasswordProvider) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  // Interval to automatically check for verification
  useEffect(() => {
    if (user && !user.emailVerified) {
      const interval = setInterval(async () => {
        await user.reload();
        if (user.emailVerified) {
          router.push('/dashboard');
        }
      }, 5000); // Check every 5 seconds
      return () => clearInterval(interval);
    }
  }, [user, router]);

  // Cooldown timer effect
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsResending(true);
    try {
      await resendVerificationEmail(auth);
      toast({
        title: 'Verification Email Sent',
        description: 'Please check your inbox (and spam folder).',
      });
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Send Email',
        description: error.message || 'An unknown error occurred.',
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleLogout = async () => {
    await logout(auth);
    router.push('/login');
  };

  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/5">
        <div className="text-center space-y-6 p-4">
          <Logo className="justify-center text-h3" />
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-secondary/10 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <Card className="w-full max-w-md shadow-2xl shadow-primary/5">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto p-4 bg-primary/10 rounded-full w-fit">
              <MailCheck className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-h3">Check Your Email</CardTitle>
            <CardDescription className="text-body leading-relaxed">
              We've sent a verification link to{' '}
              <span className="font-semibold text-primary">{user.email}</span>. Please click the link to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleResend}
              disabled={isResending || resendCooldown > 0}
              className="w-full"
            >
              {isResending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Resend Verification Email'
              )}
              {resendCooldown > 0 && ` (${resendCooldown}s)`}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Didn't receive an email? Check your spam folder or resend.
            </p>
          </CardContent>
          <div className="p-6 border-t">
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
