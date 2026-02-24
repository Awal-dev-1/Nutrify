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
    <section className="py-12 md:py-24 bg-secondary/50">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            A Simpler Path to Health
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Getting started with your nutrition journey is as easy as one, two,
            three.
          </p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <Card key={index} className="text-center">
              <CardHeader>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  {step.icon}
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-xl">{step.title}</CardTitle>
                <p className="mt-2 text-muted-foreground">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
