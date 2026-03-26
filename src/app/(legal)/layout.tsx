
"use client";

import { Logo } from "@/components/shared/logo";
import { TransitionLink } from "@/components/shared/transition-link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-secondary/30 min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <Button variant="outline" asChild>
            <TransitionLink href="/dashboard/settings">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Settings
            </TransitionLink>
          </Button>
        </div>
      </header>
      <motion.main
        className="container py-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ease: "easeInOut", duration: 0.2 }}
      >
        <div className="max-w-4xl mx-auto bg-card p-8 rounded-lg shadow-sm">
          {children}
        </div>
      </motion.main>
    </div>
  );
}
