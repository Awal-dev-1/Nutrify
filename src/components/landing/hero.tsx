'use client';

// components/landing/hero.tsx
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { ArrowRight, Sparkles, Camera, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

export function Hero() {
  const heroImage = PlaceHolderImages.find(
    (img) => img.id === "hero-background"
  );

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {heroImage && (
        <>
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover scale-105 animate-slow-zoom"
            priority
            data-ai-hint={heroImage.imageHint}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/40" />
        </>
      )}
      
      <div className="relative z-10 container px-4 py-16 md:py-24">
        <div className="max-w-5xl mx-auto text-center text-white space-y-8 md:space-y-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center rounded-full bg-white/10 backdrop-blur-sm px-4 py-1.5 text-small"
          >
            <Camera className="h-3.5 w-3.5 mr-2" />
            AI-Powered Nutrition Tracking
            <Sparkles className="h-3.5 w-3.5 ml-2 text-yellow-300" />
          </motion.div>
          
          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
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
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-body text-white/90 max-w-3xl mx-auto leading-relaxed px-4"
          >
            Discover the rich world of Ghanaian cuisine and take control of your
            health. Nutrify helps you understand, track, and improve your diet
            with smart, AI-powered tools.
          </motion.p>
          
          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row justify-center gap-4 pt-4 px-4"
          >
            <Button 
              size="lg" 
              asChild 
              className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 hover:scale-105 transition-all duration-300 px-6 sm:px-8 py-5 sm:py-6 text-body rounded-full group"
            >
              <Link href="/signup">
                Get Started for Free
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              asChild 
              className="border-white/20 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 hover:border-white/30 px-6 sm:px-8 py-5 sm:py-6 text-body rounded-full transition-all duration-300"
            >
              <Link href="/login">Login</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
