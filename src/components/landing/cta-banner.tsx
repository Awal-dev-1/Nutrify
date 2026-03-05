'use client';

// components/landing/cta-banner.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, CheckCircle } from "lucide-react";
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
        transition={{ duration: 0.7 }}
        className="container relative px-4 py-16 md:py-24 lg:py-32"
      >
        <div className="max-w-3xl mx-auto text-center space-y-6 md:space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center rounded-full bg-white/10 backdrop-blur-sm px-4 py-1.5 text-xs sm:text-sm border border-white/20">
            <Sparkles className="h-3.5 w-3.5 mr-2" />
            Limited Time Offer
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
            Start your journey to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400">
              better nutrition
            </span>{" "}
            today.
          </h2>
          
          <p className="text-base sm:text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto">
            Sign up now and get immediate access to all our smart features. No
            commitment, cancel anytime.
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-3 md:gap-4 pt-2">
            {["Free forever", "No credit card", "Cancel anytime"].map((benefit) => (
              <div key={benefit} className="flex items-center gap-1.5 text-xs sm:text-sm text-primary-foreground/80">
                <CheckCircle className="h-4 w-4" />
                {benefit}
              </div>
            ))}
          </div>
          
          <div className="pt-4 md:pt-6">
            <Button 
              size="lg" 
              asChild 
              className="bg-white text-primary hover:bg-white/90 px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              <Link href="/signup">
                Sign Up for Free
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
