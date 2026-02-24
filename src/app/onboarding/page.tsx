"use client";

import { useState } from "react";
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

const totalSteps = 5;

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});
  const router = useRouter();

  const handleNext = (data: any) => {
    setFormData((prev) => ({ ...prev, ...data }));
    if (step < totalSteps + 1) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleFinish = () => {
    setStep(totalSteps + 1); // Loading step
    setTimeout(() => {
        // TODO: Save data and update user onboarding status
        router.push("/dashboard");
    }, 2000);
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

  const showProgress = step > 0 && step <= totalSteps;

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary/30">
        <Card className="w-full max-w-2xl">
            {showProgress && (
                <CardHeader>
                    <Progress value={(step / totalSteps) * 100} className="w-full" />
                    <p className="text-sm text-center text-muted-foreground mt-2">Step {step} of {totalSteps}</p>
                </CardHeader>
            )}
            <CardContent className="p-6 min-h-[300px] flex items-center justify-center">
                {stepsComponents[step]}
            </CardContent>
            {step > 0 && step <= totalSteps && (
                <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={handleBack} disabled={step === 1}>Back</Button>
                    {/* The 'Next' button is handled within each step component */}
                </CardFooter>
            )}
        </Card>
    </div>
  );
}
