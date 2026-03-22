
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WelcomeStep } from "@/components/onboarding/step-welcome";
import { DetailsStep } from "@/components/onboarding/step-details";
import { GoalsStep } from "@/components/onboarding/step-goals";
import { PreferencesStep } from "@/components/onboarding/step-preferences";
import { ActivityStep } from "@/components/onboarding/step-activity";
import { SummaryStep } from "@/components/onboarding/step-summary";
import { LoadingStep } from "@/components/onboarding/step-loading";
import { ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, useFirestore } from "@/firebase";
import { completeOnboarding } from "@/services/onboardingService";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const totalSteps = 5;

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 30 : -30,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 30 : -30,
    opacity: 0,
  }),
};

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [formData, setFormData] = useState({});
  const router = useRouter();
  const { user, userProfile, isUserLoading, isProfileLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    // Wait for user status to be resolved
    if (isUserLoading || isProfileLoading) {
      return;
    }

    // If no user or an anonymous user, they shouldn't be here. Go to signup.
    if (!user || user.isAnonymous) {
      router.push('/signup');
      return;
    }

    // If the user has already completed onboarding, redirect to the dashboard.
    if (userProfile && userProfile.onboardingCompleted) {
      router.push('/dashboard/overview');
      return;
    }
  }, [user, userProfile, isUserLoading, isProfileLoading, router]);

  const handleNext = (data: any) => {
    setDirection(1);
    setFormData((prev) => ({ ...prev, ...data }));
    if (step < totalSteps + 1) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setDirection(-1);
    setStep((prev) => prev - 1);
  };

  const handleFinish = async () => {
    if (!user || !db) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "User session not found. Please try logging in again."
        });
        router.push('/login');
        return;
    };
    setStep(totalSteps + 1); // Go to Loading step

    try {
        await completeOnboarding(db, user.uid, formData as any);

        toast({
            title: "Profile Created!",
            description: "Welcome to Nutrify! Your personalized dashboard is ready."
        });
        router.push("/dashboard/overview");

    } catch (error) {
        console.error("Onboarding failed:", error);
        toast({
            variant: "destructive",
            title: "Setup Failed",
            description: "Could not save your profile. Please review your details and try again."
        });
        setStep(totalSteps); 
    }
  };

  const stepsComponents = [
    <WelcomeStep onNext={handleNext} />,
    <DetailsStep onNext={handleNext} />,
    <GoalsStep onNext={handleNext} />,
    <PreferencesStep onNext={handleNext} />,
    <ActivityStep onNext={handleNext} />,
    <SummaryStep formData={formData} onFinish={handleFinish} />,
    <LoadingStep />
  ];
  
  // Render a loading state while we check the user's status to prevent UI flicker
  const showPageLoading = isUserLoading || isProfileLoading || !user || user.isAnonymous || (userProfile && userProfile.onboardingCompleted);
  if (showPageLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <LoadingStep />
        </div>
    );
  }

  const showProgress = step > 0 && step <= totalSteps;
  const progressValue = ((step) / totalSteps) * 100;

  const stepTitles = [
    "Welcome",
    "Your Details",
    "Set Your Goals",
    "Dietary Preferences",
    "Activity Level",
    "Review & Confirm",
    "Creating Your Profile"
  ];

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/30 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-2xl px-4 relative z-10"
      >
        <Card className="border-2 shadow-xl overflow-hidden backdrop-blur-sm bg-background/95">
          {step === 0 && (
            <div className="pt-8 flex justify-center">
              <div className="flex items-center px-4 py-2 rounded-full bg-primary/10">
                <span className="font-semibold text-primary">Nutrify</span>
              </div>
            </div>
          )}

          {showProgress && (
            <CardHeader className="space-y-4 pb-2">
              <div className="flex items-center justify-between text-body">
                <span className="font-medium text-primary">{stepTitles[step]}</span>
                <span className="text-muted-foreground">Step {step} of {totalSteps}</span>
              </div>
              
              <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="absolute left-0 top-0 h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressValue}%` }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                />
              </div>

              <div className="flex justify-between pt-1">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-300",
                      i + 1 <= step 
                        ? "bg-primary scale-100" 
                        : i + 1 === step + 1
                        ? "bg-primary/50 scale-125"
                        : "bg-muted-foreground/20"
                    )}
                  />
                ))}
              </div>
            </CardHeader>
          )}

          <CardContent className="p-6 md:p-8 min-h-[400px] flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30, duration: 0.3 },
                  opacity: { duration: 0.2 }
                }}
                className="w-full"
              >
                {stepsComponents[step]}
              </motion.div>
            </AnimatePresence>
          </CardContent>

          {step > 0 && step <= totalSteps && (
            <CardFooter className="flex justify-between p-6 pt-0 border-t mt-4">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={step === 1}
                className={cn(
                  "gap-2 transition-all",
                  step === 1 ? "opacity-50" : "hover:gap-1"
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              
              <p className="text-small text-muted-foreground hidden md:block">
                Press Enter to continue
              </p>
              
              <div className="w-[72px]" />
            </CardFooter>
          )}
        </Card>

        {step === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-8 text-body text-muted-foreground"
          >
            <p>Your information is secure and never shared</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
