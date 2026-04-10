
"use client";

// components/landing/header.tsx
import { TransitionLink } from "@/components/shared/transition-link";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Only run the scroll effect on non-mobile screens
      if (window.innerWidth >= 768) {
        setScrolled(window.scrollY > 10);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    // Initial check on mount
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={cn(
      "fixed top-0 z-50 w-full transition-all duration-300 hidden md:block",
      scrolled ? "border-b bg-background/80 backdrop-blur-xl" : "bg-transparent"
    )}>
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Logo />
        
        <div className="flex items-center gap-3">
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
      </div>
    </header>
  );
}
