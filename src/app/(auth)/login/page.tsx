
"use client";

import { LoginForm } from "@/components/auth/login-form";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, Leaf } from "lucide-react";
import { TransitionLink } from "@/components/shared/transition-link";
import { Logo } from "@/components/shared/logo";
import { motion } from "framer-motion";

export default function LoginPage() {
  const { user, isUserLoading, userProfile, isProfileLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Wait until user and profile status are known.
    if (isUserLoading || isProfileLoading) {
      return;
    }

    // If a real (non-anonymous) user is logged in, redirect them.
    if (user && !user.isAnonymous) {
      if (userProfile && userProfile.onboardingCompleted) {
        // If onboarded, go to the dashboard.
        router.push("/dashboard/overview");
      } else if (userProfile) {
        // If not onboarded, go to onboarding.
        router.push("/onboarding");
      }
      // If userProfile doesn't exist yet, the loading state will prevent a flash of content.
    }
  }, [user, isUserLoading, userProfile, isProfileLoading, router]);

  // Show a loader while we determine the user's status and redirect if necessary.
  const showLoading = isUserLoading || isProfileLoading || (user && !user.isAnonymous);

  if (showLoading) {
    let loadingMessage = "Checking credentials...";
    if (!isUserLoading && isProfileLoading) {
      loadingMessage = "Loading your profile...";
    } else if (!isUserLoading && !isProfileLoading && user) {
      loadingMessage = "Redirecting to your dashboard...";
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/5">
        <div className="text-center space-y-6 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
            <Logo className="justify-center text-h3" />
          </motion.div>
          <div className="relative flex justify-center items-center h-16">
            <div className="absolute h-16 w-16 bg-primary/10 rounded-full blur-2xl animate-pulse"></div>
            <Loader2 className="h-10 w-10 animate-spin text-primary relative" />
          </div>
          <motion.div
            key={loadingMessage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-1"
          >
            <p className="font-medium text-foreground">{loadingMessage}</p>
            <p className="text-small text-muted-foreground animate-pulse">
              Please wait while we prepare your dashboard.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // If loading is finished and no redirect is needed, show the login form.
  return (
    <motion.div
      className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-background via-background to-secondary/10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      {/* Left Side - Branding (visible on md and up) */}
      <div className="hidden md:flex md:w-5/12 lg:w-1/2 relative bg-gradient-to-br from-primary/5 via-primary/5 to-background items-center justify-center p-6 lg:p-8 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-6 left-6">
          <TransitionLink href="/">
            <Logo />
          </TransitionLink>
        </div>
        <div className="absolute inset-0 bg-grid-primary/5 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 max-w-md text-center space-y-6">
          {/* Brand */}
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
            <Leaf className="h-5 w-5 text-primary" />
            <span className="text-small font-medium text-primary">Nutrify</span>
          </div>
          
          {/* Hero Content */}
          <h1 className="text-h2 font-bold tracking-tight">
            Welcome Back to{" "}
            <span className="text-primary">Healthy Living</span>
          </h1>
          
          <p className="text-body text-muted-foreground/90 leading-relaxed">
            Track your nutrition, discover local foods, and get personalized
            AI-powered recommendations to reach your health goals.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 relative">
        <div className="absolute top-6 left-6 md:hidden">
          <TransitionLink href="/">
            <Logo />
          </TransitionLink>
        </div>
        
        <LoginForm />
      </div>
    </motion.div>
  );
}
