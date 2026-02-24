import {
  Bot,
  Database,
  HeartPulse,
  Sparkles,
  BarChart2,
  CalendarCheck,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const featuresList = [
  {
    icon: <Bot className="h-10 w-10 text-primary" />,
    title: "AI Food Recognition",
    description:
      "Snap a photo of your meal and let our AI identify the food and its nutrients.",
  },
  {
    icon: <Database className="h-10 w-10 text-primary" />,
    title: "Local Ghanaian Food Database",
    description:
      "The most comprehensive database of local dishes, from Waakye to Fufu.",
  },
  {
    icon: <HeartPulse className="h-10 w-10 text-primary" />,
    title: "Smart Nutrient Tracking",
    description:
      "Effortlessly track calories, macros (protein, carbs, fat), and key micronutrients.",
  },
  {
    icon: <Sparkles className="h-10 w-10 text-primary" />,
    title: "Personalized Recommendations",
    description:
      "Get smart suggestions on what to eat next based on your goals and deficiencies.",
  },
  {
    icon: <BarChart2 className="h-10 w-10 text-primary" />,
    title: "Analytics & Trends",
    description:
      "Visualize your progress with beautiful charts and see your habits over time.",
  },
  {
    icon: <CalendarCheck className="h-10 w-10 text-primary" />,
    title: "AI-Powered Meal Planning",
    description:
      "Generate weekly meal plans tailored to your needs with a single click.",
  },
];

export function Features() {
  return (
    <section className="py-16 md:py-24 lg:py-32 bg-gradient-to-b from-background to-background/80">
      <div className="container px-4 md:px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
            <Sparkles className="h-4 w-4 mr-2" />
            Powerful Features
          </div>
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Everything You Need to Succeed
          </h2>
          <p className="text-lg text-muted-foreground/90 max-w-2xl mx-auto leading-relaxed">
            Nutrify is packed with powerful features to make healthy eating
            simple and effective.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featuresList.map((feature, index) => (
            <Card
              key={feature.title}
              className="group relative border-2 border-primary/5 bg-gradient-to-b from-card to-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-2"
            >
              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <CardHeader className="pb-4">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 group-hover:from-primary/30 group-hover:to-primary/10 transition-all duration-300">
                  <div className="transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    {feature.icon}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="relative space-y-3">
                <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors duration-300">
                  {feature.title}
                </CardTitle>
                <CardDescription className="text-base leading-relaxed text-muted-foreground/80">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">2,000+</span> users already tracking their nutrition
          </p>
        </div>
      </div>
    </section>
  );
}