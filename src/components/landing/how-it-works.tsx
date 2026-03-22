'use client';

// components/landing/how-it-works.tsx
import { Scan, BarChart, HeartPulse, ArrowRight, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

const steps = [
  {
    icon: <Scan className="h-8 w-8 md:h-10 md:w-10 text-primary" />,
    title: "Search or Scan Food",
    description:
      "Instantly get your nutrient information by search, image, or camera.",
    benefits: ["Text Search", "Image Upload", "Camera Scan"],
  },
  {
    icon: <BarChart className="h-8 w-8 md:h-10 md:w-10 text-primary" />,
    title: "View Nutrient Breakdown",
    description:
      "Get a detailed analysis of calories, macros, and micronutrients for every item you log.",
    benefits: ["Real-time tracking", "Visual charts", "Goal progress"],
  },
  {
    icon: <HeartPulse className="h-8 w-8 md:h-10 md:w-10 text-primary" />,
    title: "Track & Improve Health",
    description:
      "Monitor your progress, get smart insights, and receive personalized recommendations to reach your goals.",
    benefits: ["AI insights", "Personalized", "Weekly reports"],
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 md:py-24 lg:py-32 bg-gradient-to-b from-secondary/5 to-background">
      <div className="container px-4">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-1.5 text-small text-blue-500">
            <CheckCircle className="h-3.5 w-3.5 mr-2" />
            Simple Process
          </div>
          <h2 className="text-h1 font-bold tracking-tight">
            A Simpler Path to Health
          </h2>
          <p className="text-body text-muted-foreground/90 max-w-2xl mx-auto">
            Getting started with your nutrition journey is as easy as one, two,
            three.
          </p>
        </div>
        
        <div className="relative mt-12 md:mt-16 lg:mt-24">
          {/* Connecting line (desktop only) */}
          <div className="absolute top-24 left-1/2 -translate-x-1/2 w-3/4 h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent hidden lg:block" />
          
          <div className="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-3 relative">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card 
                  className="relative border-0 bg-gradient-to-b from-card to-card/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden group h-full"
                >
                  {/* Step number */}
                  <div className="absolute -top-4 -right-4 w-16 h-16 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-300" />
                  <div className="absolute top-4 right-4 text-h1 font-bold text-primary/5 select-none">
                    {index + 1}
                  </div>
                  
                  <CardHeader className="pb-2">
                    <div className="mx-auto flex h-20 w-20 md:h-24 md:w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 group-hover:from-primary/30 group-hover:to-primary/10 transition-all duration-300 mb-2">
                      <div className="transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                        {step.icon}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="text-center space-y-3 md:space-y-4 px-3 md:px-6 pb-6">
                    <CardTitle className="text-h3 font-bold">
                      {step.title}
                    </CardTitle>
                    <p className="text-small text-muted-foreground/80 leading-relaxed">
                      {step.description}
                    </p>
                    
                    {/* Benefits list */}
                    <div className="pt-2 space-y-1.5">
                      {step.benefits.map((benefit, i) => (
                        <div key={i} className="flex items-center justify-center gap-1.5 text-small text-muted-foreground">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {benefit}
                        </div>
                      ))}
                    </div>
                    
                    {/* Progress indicator for mobile */}
                    {index < steps.length - 1 && (
                      <div className="flex justify-center mt-4 md:hidden">
                        <ArrowRight className="h-5 w-5 text-primary/50 animate-pulse" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom accent */}
        <div className="mt-12 md:mt-16 text-center">
          <div className="inline-flex items-center gap-2 text-small text-muted-foreground bg-muted/30 px-4 py-2 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Start your journey in minutes — no credit card required
          </div>
        </div>
      </div>
    </section>
  );
}
