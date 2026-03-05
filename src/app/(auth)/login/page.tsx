"use client";

import { LoginForm } from "@/components/auth/login-form";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, Leaf, Utensils } from "lucide-react";
import Link from "next/link";

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/5">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse"></div>
            <Loader2 className="h-12 w-12 animate-spin text-primary relative" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading your account...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-background via-background to-secondary/10">
      {/* Left Side - Branding (visible on md and up) */}
      <div className="hidden md:flex md:w-5/12 lg:w-1/2 relative bg-gradient-to-br from-primary/5 via-primary/5 to-background items-center justify-center p-6 lg:p-8 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-grid-primary/5 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 max-w-md text-center space-y-6">
          {/* Brand */}
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
            <Leaf className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">Nutrify</span>
          </div>
          
          {/* Hero Content */}
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
            Welcome Back to{" "}
            <span className="text-primary">Healthy Living</span>
          </h1>
          
          <p className="text-base text-muted-foreground/90 leading-relaxed">
            Track your nutrition, discover local foods, and get personalized
            AI-powered recommendations to reach your health goals.
          </p>
          
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 relative">
        {/* Mobile header (visible only on mobile) */}
        <div className="absolute top-6 left-0 right-0 flex justify-center md:hidden">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
            <Leaf className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Nutrify</span>
          </div>
        </div>
        
        <div className="relative w-full max-w-md space-y-6 pt-16 md:pt-0">
          {/* Header text */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Sign in to your account
            </h2>
            <p className="text-sm text-muted-foreground">
              Welcome back! Please enter your details.
            </p>
          </div>

          {/* Login Form */}
          <LoginForm />

          {/* Footer links */}
          <div className="text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link 
              href="/signup" 
              className="text-primary font-medium hover:underline"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}