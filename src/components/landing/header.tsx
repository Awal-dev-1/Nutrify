
"use client";

// components/landing/header.tsx
import { TransitionLink } from "@/components/shared/transition-link";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Logo />
        
        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Button 
            variant="ghost" 
            asChild 
            className="rounded-full px-5 hover:bg-primary/5 hover:text-primary transition-all duration-200"
          >
            <TransitionLink href="/login">Login</TransitionLink>
          </Button>
          <Button 
            asChild 
            className="rounded-full bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
          >
            <TransitionLink href="/signup">Sign Up</TransitionLink>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={cn(
        "md:hidden absolute top-16 left-0 right-0 bg-background/95 backdrop-blur-xl border-b transition-all duration-300 ease-in-out",
        isMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
      )}>
        <div className="container px-4 py-6 space-y-4">
          <div className="flex flex-col gap-3">
            <Button 
              variant="ghost" 
              asChild 
              className="w-full rounded-full"
              onClick={() => setIsMenuOpen(false)}
            >
              <TransitionLink href="/login">Login</TransitionLink>
            </Button>
            <Button 
              asChild 
              className="w-full rounded-full bg-gradient-to-r from-primary to-primary/90"
              onClick={() => setIsMenuOpen(false)}
            >
              <TransitionLink href="/signup">Sign Up</TransitionLink>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
