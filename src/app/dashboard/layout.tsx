'use client';

import { MainSidebar } from "@/components/dashboard/main-sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading, userProfile, isProfileLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading || isProfileLoading) {
      return;
    }
    if (!user) {
      router.push('/login');
    } else if (user && userProfile && !userProfile.onboardingCompleted) {
      router.push('/onboarding');
    }
  }, [user, userProfile, isUserLoading, isProfileLoading, router]);
  
  if (isUserLoading || isProfileLoading || !user || (userProfile && !userProfile.onboardingCompleted)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
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
        <main className="min-h-[calc(100vh-4rem)] bg-background p-4 lg:p-6">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
