
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
import { ChevronLeft, Loader2, Sparkles, CheckCircle, Heart, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, useFirestore } from "@/firebase";
import { completeOnboarding, skipOnboarding } from "@/services/onboardingService";
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
  const [isSkipping, setIsSkipping] = useState(false);
  const router = useRouter();
  const { user, userProfile, isUserLoading, isProfileLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (isUserLoading || isProfileLoading) {
      return;
    }

    if (!user || user.isAnonymous) {
      router.push('/signup');
      return;
    }

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
    setStep(totalSteps + 1);

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

  const handleSkip = async () => {
    if (!user || !db || isSkipping) return;
    
    setIsSkipping(true);

    try {
        await skipOnboarding(db, user.uid);
        toast({
            title: "Setup Skipped",
            description: "Welcome to Nutrify! You can complete your profile later in settings."
        });
        router.push("/dashboard/overview");
    } catch (error) {
        console.error("Skipping onboarding failed:", error);
        toast({
            variant: "destructive",
            title: "Skip Failed",
            description: "Could not skip onboarding. Please try again."
        });
        setIsSkipping(false);
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
  
  const showPageLoading = isUserLoading || isProfileLoading || !user || user.isAnonymous || (userProfile && userProfile.onboardingCompleted);
  if (showPageLoading) {
    return (
        <div className="flex items-center justify-center min-h-dvh">
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

  const stepIcons = [Sparkles, Heart, Target, Sparkles, Sparkles, CheckCircle, Loader2];

  return (
    <div className="relative flex items-center justify-center min-h-dvh bg-gradient-to-br from-primary/5 via-background to-secondary/30 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/20 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
        />
      </div>

      <div className="w-full max-w-2xl px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border shadow-2xl overflow-hidden backdrop-blur-sm bg-background/95 transition-all duration-300 hover:shadow-primary/5">
            {/* Decorative top bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0" />
            
            {step > 0 && step <= totalSteps && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20"
              >
                <Button 
                  variant="link" 
                  onClick={handleSkip} 
                  disabled={isSkipping} 
                  className="text-muted-foreground h-11 px-4 hover:no-underline hover:text-foreground transition-all duration-200"
                >
                  {isSkipping ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Skip'}
                </Button>
              </motion.div>
            )}

            {step === 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="pt-8 flex justify-center"
              >
                <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 backdrop-blur-sm">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-primary">Welcome to Nutrify</span>
                </div>
              </motion.div>
            )}

            {showProgress && (
              <CardHeader className="space-y-4 pt-12 sm:pt-10 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {stepIcons[step] && (
                      <motion.div
                        initial={{ rotate: -180, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        className="p-1.5 rounded-lg bg-primary/10"
                      >
                        {(() => {
                          const Icon = stepIcons[step];
                          return <Icon className="h-4 w-4 text-primary" />;
                        })()}
                      </motion.div>
                    )}
                    <span className="font-semibold text-foreground">{stepTitles[step]}</span>
                  </div>
                  <motion.span 
                    key={step}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-sm font-medium text-primary"
                  >
                    Step {step} of {totalSteps}
                  </motion.span>
                </div>
                
                <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressValue}%` }}
                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <motion.div 
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                    />
                  </motion.div>
                </div>

                <div className="flex justify-between pt-2">
                  {Array.from({ length: totalSteps }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={false}
                      animate={{
                        scale: i + 1 <= step ? [0, 1.2, 1] : 1,
                      }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all duration-300",
                        i + 1 <= step 
                          ? "bg-primary shadow-sm shadow-primary/30" 
                          : i + 1 === step + 1
                          ? "bg-primary/40 ring-2 ring-primary/20"
                          : "bg-muted-foreground/20"
                      )}
                    />
                  ))}
                </div>
              </CardHeader>
            )}

            <CardContent className="p-6 md:p-8 min-h-[420px] flex items-center justify-center overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 350, damping: 30, duration: 0.3 },
                    opacity: { duration: 0.2 }
                  }}
                  className="w-full"
                >
                  {stepsComponents[step]}
                </motion.div>
              </AnimatePresence>
            </CardContent>

            {step > 0 && step <= totalSteps && (
              <CardFooter className="flex justify-between items-center p-6 pt-0 border-t mt-2">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  disabled={step === 1}
                  className={cn(
                    "gap-2 rounded-full transition-all duration-200",
                    step === 1 ? "opacity-0 invisible" : "hover:gap-1 hover:bg-muted/50"
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  className="text-xs text-muted-foreground hidden md:flex items-center gap-1"
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/40" />
                  Press Enter to continue
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/40" />
                </motion.p>
                
                <div className="w-[72px]" />
              </CardFooter>
            )}
          </Card>
        </motion.div>

        {step === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="text-center mt-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/50 backdrop-blur-sm">
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              <p className="text-xs text-muted-foreground">Your information is secure and never shared</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
