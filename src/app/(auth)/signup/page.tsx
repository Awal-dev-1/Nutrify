
"use client";

import { SignUpForm } from "@/components/auth/signup-form";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, Leaf } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { motion } from "framer-motion";

export default function SignUpPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading) {
      return; // Wait for auth state to be determined
    }

    if (user) {
      // User is created, redirect to onboarding.
      router.push("/onboarding");
    }
  }, [user, isUserLoading, router]);

  // Show a loader while checking auth status or if a user is found and we are redirecting.
  if (isUserLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/5">
        <div className="text-center space-y-6 p-4">
          <Logo className="justify-center text-h3" />
          <div className="relative flex justify-center items-center h-16">
            <div className="absolute h-16 w-16 bg-primary/10 rounded-full blur-2xl animate-pulse"></div>
            <Loader2 className="h-10 w-10 animate-spin text-primary relative" />
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground">Creating your account...</p>
            <p className="text-small text-muted-foreground animate-pulse">
              Getting everything set up for you.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-background via-background to-secondary/10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Left Side - Branding (visible on md and up) */}
      <div className="hidden md:flex md:w-5/12 lg:w-1/2 relative bg-gradient-to-br from-primary/5 via-primary/5 to-background items-center justify-center p-6 lg:p-8 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-6 left-6">
          <Link href="/">
            <Logo />
          </Link>
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
            Begin Your Journey to a{" "}
            <span className="text-primary">Healthier You</span>
          </h1>
          
          <p className="text-body text-muted-foreground/90 leading-relaxed">
            Create your account to start tracking your nutrition, discovering local foods, and getting personalized AI-powered health insights.
          </p>
        </div>
      </div>

      {/* Right Side - Sign Up Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 relative">
        <div className="absolute top-6 left-6 md:hidden">
          <Link href="/">
            <Logo />
          </Link>
        </div>
        
        <SignUpForm />
      </div>
    </motion.div>
  );
}
