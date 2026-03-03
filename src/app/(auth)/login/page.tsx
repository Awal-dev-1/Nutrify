"use client";

import { LoginForm } from "@/components/auth/login-form";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";


export default function LoginPage() {
  const { user, isUserLoading, userProfile, isProfileLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading || isProfileLoading) {
      return; // Wait for auth and profile state to be determined
    }

    // This logic handles redirection for a user who is already logged in
    // or has just successfully logged in.
    if (user && userProfile) {
      if (userProfile.onboardingCompleted) {
        // User is fully set up, go to the main dashboard.
        router.push("/dashboard/overview");
      } else {
        // User has a profile but hasn't finished onboarding. Send them there.
        router.push("/onboarding");
      }
    }
    // If there's no user, or a user without a profile document,
    // we remain on the login page. The signup flow is responsible
    // for directing new users to the onboarding page.
    
  }, [user, userProfile, isUserLoading, isProfileLoading, router]);

  // Show a loading screen while auth state is being determined or while redirecting.
  if (isUserLoading || isProfileLoading || (user && userProfile)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return <LoginForm />;
}
