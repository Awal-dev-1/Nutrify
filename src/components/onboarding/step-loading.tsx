import { Loader2 } from 'lucide-react';

export function LoadingStep() {
  return (
    <div className="text-center flex flex-col items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <h2 className="text-2xl font-bold mt-6">Setting up your personalized experience...</h2>
      <p className="mt-2 text-muted-foreground">This will just take a moment.</p>
    </div>
  );
}
