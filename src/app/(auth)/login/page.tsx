
"use client";

import { LoginForm } from "@/components/auth/login-form";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";


export default function LoginPage() {
  const { user, isUserLoading, userProfile, isProfileLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading || isProfileLoading) {
      return; // Wait for auth and profile state to be determined
    }

    if (user && userProfile) {
      if (userProfile.onboardingCompleted) {
        router.push("/dashboard/tracker");
      } else {
        router.push("/onboarding");
      }
    } else if (user) {
      // User is authenticated but profile is not (yet) available.
      // This can happen briefly on first signup. Go to onboarding.
      router.push("/onboarding");
    }
    // If no user, remain on login page.
    
  }, [user, userProfile, isUserLoading, isProfileLoading, router]);

  if (isUserLoading || isProfileLoading || user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return <LoginForm />;
}
