'use client';

// components/landing/header.tsx
import { TransitionLink } from "@/components/shared/transition-link";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth >= 768) {
        setScrolled(window.scrollY > 10);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  return (
    <>
      {/* Desktop Header */}
      <header className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300 hidden md:block",
        scrolled ? "border-b bg-background/80 backdrop-blur-xl shadow-sm" : "bg-transparent"
      )}>
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Logo />
          </motion.div>
          
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Button 
              variant="ghost" 
              asChild 
              className="rounded-full px-6 hover:bg-primary/5 hover:text-primary transition-all duration-200 font-medium"
            >
              <TransitionLink href="/login">Login</TransitionLink>
            </Button>
            <Button 
              asChild 
              className="rounded-full bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium px-6"
            >
              <TransitionLink href="/signup">Sign Up</TransitionLink>
            </Button>
          </motion.div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300 md:hidden",
        scrolled ? "border-b bg-background/80 backdrop-blur-xl shadow-sm" : "bg-transparent"
      )}>
        <div className="container flex h-16 items-center justify-between px-4">
          <Logo />
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 text-white" />
            ) : (
              <Menu className="h-5 w-5 text-white" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 md:hidden bg-black/95 backdrop-blur-md"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="flex flex-col items-center justify-center min-h-screen gap-6 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
              >
                <Logo />
              </motion.div>
              
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="w-full max-w-xs"
              >
                <Button 
                  variant="ghost" 
                  asChild 
                  className="w-full rounded-full py-6 text-base font-medium hover:bg-white/10 hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <TransitionLink href="/login">Login</TransitionLink>
                </Button>
              </motion.div>
              
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="w-full max-w-xs"
              >
                <Button 
                  asChild 
                  className="w-full rounded-full bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg py-6 text-base font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <TransitionLink href="/signup">Sign Up</TransitionLink>
                </Button>
              </motion.div>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-xs text-white/40 absolute bottom-8"
              >
                Start your health journey today
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}