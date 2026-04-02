
'use client';

import { MainSidebar } from "@/components/dashboard/main-sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTheme } from 'next-themes';
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { motion } from 'framer-motion';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading, userProfile, isProfileLoading } = useUser();
  const router = useRouter();
  const { setTheme } = useTheme();

  // Effect to set theme from user profile
  useEffect(() => {
    if (userProfile?.preferences?.themePreference) {
      setTheme(userProfile.preferences.themePreference);
    }
  }, [userProfile, setTheme]);

  useEffect(() => {
    if (isUserLoading || isProfileLoading) {
      return; // Wait for auth and profile state to be resolved
    }
    
    // If there is no user, or the user is anonymous, redirect to login.
    if (!user || user.isAnonymous) {
      router.push('/login');
      return;
    }
    
    // If there is a real user, but they haven't completed onboarding, redirect them.
    if (userProfile && !userProfile.onboardingCompleted) {
      router.push('/onboarding');
      return;
    }
  }, [user, userProfile, isUserLoading, isProfileLoading, router]);
  
  // Determine if we should show the loading screen.
  // This covers initial load, or if a redirect is about to happen.
  const showLoading = isUserLoading || 
                      isProfileLoading || 
                      !user || 
                      user.isAnonymous ||
                      (userProfile && !userProfile.onboardingCompleted);

  if (showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/5">
        <div className="text-center space-y-6 p-4">
          <Logo className="justify-center text-2xl" />
          <div className="relative flex justify-center items-center h-16">
            <div className="absolute h-16 w-16 bg-primary/10 rounded-full blur-2xl animate-pulse"></div>
            <Loader2 className="h-10 w-10 animate-spin text-primary relative" />
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground">Loading Your Dashboard</p>
            <p className="text-sm text-muted-foreground animate-pulse">
              Just a moment...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <MainSidebar />
      </Sidebar>
      <SidebarInset>
        <DashboardHeader />
        <motion.main
          className="min-h-[calc(100vh-4rem)] bg-background p-4 lg:p-6 pb-24 md:pb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ease: "easeInOut", duration: 0.2 }}
        >
            {children}
        </motion.main>
        <BottomNav />
      </SidebarInset>
    </SidebarProvider>
  );
}
