import { Scan, BarChart, HeartPulse } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const steps = [
  {
    icon: <Scan className="h-10 w-10 text-primary" />,
    title: "Search or Scan Food",
    description:
      "Instantly find any food from our vast database or use your camera to recognize your meal.",
  },
  {
    icon: <BarChart className="h-10 w-10 text-primary" />,
    title: "View Nutrient Breakdown",
    description:
      "Get a detailed analysis of calories, macros, and micronutrients for every item you log.",
  },
  {
    icon: <HeartPulse className="h-10 w-10 text-primary" />,
    title: "Track & Improve Health",
    description:
      "Monitor your progress, get smart insights, and receive personalized recommendations to reach your goals.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-background to-secondary/30">
      <div className="container px-4">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            A Simpler Path to Health
          </h2>
          <p className="text-lg text-muted-foreground/90 max-w-2xl mx-auto">
            Getting started with your nutrition journey is as easy as one, two,
            three.
          </p>
        </div>
        
        <div className="relative mt-16 lg:mt-24">
          {/* Connecting line (desktop only) */}
          <div className="absolute top-24 left-1/2 -translate-x-1/2 w-3/4 h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent hidden lg:block" />
          
          <div className="grid gap-8 md:grid-cols-3 relative">
            {steps.map((step, index) => (
              <Card 
                key={index} 
                className="relative border-0 bg-gradient-to-b from-card to-card/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden group"
              >
                {/* Step number */}
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-300" />
                <div className="absolute top-6 right-6 text-6xl font-bold text-primary/5 select-none">
                  {index + 1}
                </div>
                
                <CardHeader>
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 group-hover:from-primary/30 group-hover:to-primary/10 transition-all duration-300 mb-2">
                    <div className="transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      {step.icon}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="text-center space-y-3">
                  <CardTitle className="text-2xl font-bold">
                    {step.title}
                  </CardTitle>
                  <p className="text-muted-foreground/80 leading-relaxed">
                    {step.description}
                  </p>
                  
                  {/* Progress indicator */}
                  {index < steps.length - 1 && (
                    <div className="flex justify-center mt-4 lg:hidden">
                      <div className="w-1 h-8 bg-gradient-to-b from-primary/30 to-transparent rounded-full" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Bottom accent */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Start your journey in minutes
          </div>
        </div>
      </div>
    </section>
  );
}