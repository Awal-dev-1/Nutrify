import { Button } from "@/components/ui/button";

export function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center">
      <h1 className="text-h2 font-bold">Welcome to Nutrify!</h1>
      <p className="mt-2 text-h4 text-muted-foreground">Your Personal Nutrition Companion</p>
      <p className="mt-4 max-w-md mx-auto">Let's get you set up with a personalized experience. It will only take a minute.</p>
      <Button onClick={onNext} className="mt-8" size="lg">Let's Begin</Button>
    </div>
  );
}
