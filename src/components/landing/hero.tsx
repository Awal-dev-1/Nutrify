'use client';

// components/landing/hero.tsx
import { TransitionLink } from "@/components/shared/transition-link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Camera, Shield, Zap } from "lucide-react";
import { motion } from "framer-motion";
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function Hero() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-background');

  // Floating animation for decorative elements
  const floatingAnimation = {
    y: [0, -10, 0],
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
  };

  return (
    <section className="relative h-[100dvh] flex flex-col items-center justify-center overflow-hidden">
      {/* Background Image with enhanced overlay gradient */}
      {heroImage && (
        <Image
          src={heroImage.imageUrl}
          alt={heroImage.description}
          fill
          className="object-cover scale-105"
          priority
          data-ai-hint={heroImage.imageHint}
        />
      )}
      
      {/* Gradient overlay for better text contrast and depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
      
      {/* Subtle animated grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
      
      {/* Decorative floating particles */}
      <motion.div 
        className="absolute top-20 left-10 w-2 h-2 bg-green-400 rounded-full blur-sm"
        animate={floatingAnimation}
      />
      <motion.div 
        className="absolute bottom-32 right-20 w-3 h-3 bg-green-500 rounded-full blur-sm"
        animate={{ ...floatingAnimation, transition: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 } }}
      />
      <motion.div 
        className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-white rounded-full blur-sm"
        animate={{ ...floatingAnimation, transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 } }}
      />
      
      {/* Main Content Container */}
      <div className="relative z-10 container px-4 py-16 md:py-24">
        {/* Glassmorphism Card with enhanced styling */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.21, 0.68, 0.58, 1] }}
          className="max-w-3xl mx-auto text-center p-6 sm:p-8 md:p-12 space-y-6 md:space-y-8 bg-gradient-to-br from-black/30 via-black/20 to-black/30 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl"
        >
          {/* Animated border glow effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-green-500/0 via-green-500/20 to-green-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          
          {/* Badge with enhanced animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center rounded-full bg-white/10 backdrop-blur-sm px-5 py-2 text-sm font-medium border border-white/20 shadow-lg"
          >
            <Camera className="h-4 w-4 mr-2 text-green-400" />
            <span className="text-white/90">AI-Powered Nutrition Tracking</span>
            <Sparkles className="h-4 w-4 ml-2 text-yellow-300 animate-pulse" />
          </motion.div>
          
          {/* Main Heading with staggered text reveal */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight"
          >
            Eat Smart.
            <motion.span 
              className="block text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-green-400 to-emerald-500 mt-3"
              animate={{ 
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              style={{ backgroundSize: "200% auto" }}
            >
              Live Healthy.
            </motion.span>
          </motion.h1>
          
          {/* Description with improved readability */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-base sm:text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed font-light"
          >
            Discover the rich world of Ghanaian cuisine and take control of your
            health. Nutrify helps you understand, track, and improve your diet
            with smart, AI-powered tools.
          </motion.p>
          
          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="flex items-center justify-center gap-4 text-xs text-white/60"
          >
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              <span>Secure & Private</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-white/40" />
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              <span>Real-time Analysis</span>
            </div>
          </motion.div>
          
          {/* CTA Buttons with enhanced hover effects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col sm:flex-row justify-center gap-4 pt-4"
          >
            <Button 
              size="lg" 
              asChild 
              className="group relative overflow-hidden bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300 px-8 py-6 text-base rounded-full"
            >
              <>
                <span className="relative z-10 flex items-center">
                  Get Started for Free
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                </span>
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={false}
                />
              </>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              asChild 
              className="border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 hover:border-white/50 hover:scale-105 px-8 py-6 text-base rounded-full transition-all duration-300"
            >
              <TransitionLink href="/login">Login</TransitionLink>
            </Button>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Scroll indicator */}
      <motion.div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center">
          <motion.div 
            className="w-1 h-2 bg-white/50 rounded-full mt-2"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </section>
  );
}
