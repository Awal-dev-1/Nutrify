
'use client';

// components/landing/hero.tsx
import { TransitionLink } from "@/components/shared/transition-link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Camera } from "lucide-react";
import { motion } from "framer-motion";
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function Hero() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-background');

  return (
    <section className="relative h-[100dvh] flex flex-col items-center justify-center overflow-hidden">
      {/* Background Image */}
      {heroImage && (
        <Image
          src={heroImage.imageUrl}
          alt={heroImage.description}
          fill
          className="object-cover"
          priority
          data-ai-hint={heroImage.imageHint}
        />
      )}
      <div className="absolute inset-0 bg-black/50" /> {/* Overlay to ensure text readability */}
      
      {/* Main Content Container */}
      <div className="relative z-10 container px-4 py-16 md:py-24">
        {/* Glassmorphism Card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-3xl mx-auto text-center text-white p-6 sm:p-8 md:p-12 space-y-6 md:space-y-8 bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="inline-flex items-center rounded-full bg-white/10 px-4 py-1.5 text-sm"
          >
            <Camera className="h-4 w-4 mr-2" />
            AI-Powered Nutrition Tracking
            <Sparkles className="h-4 w-4 ml-2 text-yellow-300" />
          </motion.div>
          
          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="text-h1 font-bold tracking-tight leading-tight"
          >
            Eat Smart.
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-green-400 to-green-500 mt-2">
              Live Healthy.
            </span>
          </motion.h1>
          
          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="text-body text-white/90 max-w-2xl mx-auto leading-relaxed"
          >
            Discover the rich world of Ghanaian cuisine and take control of your
            health. Nutrify helps you understand, track, and improve your diet
            with smart, AI-powered tools.
          </motion.p>
          
          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="flex flex-col sm:flex-row justify-center gap-4 pt-4"
          >
            <Button 
              size="lg" 
              asChild 
              className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg shadow-green-500/25 hover:shadow-xl hover:scale-105 transition-all duration-300 px-8 py-6 text-base rounded-full group"
            >
              <TransitionLink href="/signup">
                Get Started for Free
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </TransitionLink>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              asChild 
              className="border-white/20 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 hover:border-white/30 px-8 py-6 text-base rounded-full transition-all duration-300"
            >
              <TransitionLink href="/login">Login</TransitionLink>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
