
'use client';

// components/landing/cta-banner.tsx
import { TransitionLink } from "@/components/shared/transition-link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from 'framer-motion';

export function CtaBanner() {
  return (
    <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
      
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.4 }}
        className="container relative px-4 py-16 md:py-24 lg:py-32"
      >
        <div className="max-w-3xl mx-auto text-center space-y-6 md:space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center rounded-full bg-white/10 backdrop-blur-sm px-4 py-1.5 text-small">
            <Sparkles className="h-3.5 w-3.5 mr-2" />
            Limited Time Offer
          </div>
          
          <h2 className="text-h1 font-bold tracking-tight leading-tight">
            Start your journey to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400">
              better nutrition
            </span>{" "}
            today.
          </h2>
          
          <p className="text-body text-primary-foreground/90 max-w-2xl mx-auto">
            Sign up now and get immediate access to all our smart features. No
            commitment, cancel anytime.
          </p>

          <div className="pt-4 md:pt-6">
            <Button 
              size="lg" 
              asChild 
              className="bg-white text-black hover:bg-green-500 px-6 sm:px-8 py-5 sm:py-6 text-body rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              <TransitionLink href="/signup">
                Sign Up for Free
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </TransitionLink>
            </Button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
