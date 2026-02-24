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
    <section className="py-12 md:py-24">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Everything You Need to Succeed
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Nutrify is packed with powerful features to make healthy eating
            simple and effective.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuresList.map((feature) => (
            <Card
              key={feature.title}
              className="text-center transition-all hover:shadow-lg hover:-translate-y-1"
            >
              <CardHeader>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  {feature.icon}
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription className="mt-2">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}