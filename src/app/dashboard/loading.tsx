'use client';

import { Loader2 } from "lucide-react";
import { Logo } from "@/components/shared/logo";

export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return (
    <div className="min-h-[calc(100vh-15rem)] flex items-center justify-center">
      <div className="text-center space-y-6 p-4">
        <Logo className="justify-center text-2xl" />
        <div className="relative flex justify-center items-center h-16">
          <div className="absolute h-16 w-16 bg-primary/10 rounded-full blur-2xl animate-pulse"></div>
          <Loader2 className="h-10 w-10 animate-spin text-primary relative" />
        </div>
        <div className="space-y-1">
          <p className="font-medium text-foreground">Loading Page...</p>
          <p className="text-sm text-muted-foreground animate-pulse">
            Please wait a moment.
          </p>
        </div>
      </div>
    </div>
  );
}
