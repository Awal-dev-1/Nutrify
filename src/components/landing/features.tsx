import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const featuresList = [
  {
    title: "AI Food Recognition",
    description: "Snap a photo of your meal and let our AI identify the food and its nutrients.",
    imageId: "feature-ai-recognition",
  },
  {
    title: "Local Ghanaian Food Database",
    description: "The most comprehensive database of local dishes, from Waakye to Fufu.",
    imageId: "feature-ghana-db",
  },
  {
    title: "Smart Nutrient Tracking",
    description: "Effortlessly track calories, macros (protein, carbs, fat), and key micronutrients.",
    imageId: "feature-tracking",
  },
  {
    title: "Personalized Recommendations",
    description: "Get smart suggestions on what to eat next based on your goals and deficiencies.",
    imageId: "feature-recommendations",
  },
  {
    title: "Analytics & Trends",
    description: "Visualize your progress with beautiful charts and see your habits over time.",
    imageId: "feature-analytics",
  },
  {
    title: "AI-Powered Meal Planning",
    description: "Generate weekly meal plans tailored to your needs with a single click.",
    imageId: "feature-meal-planning",
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
          {featuresList.map((feature) => {
            const image = PlaceHolderImages.find((img) => img.id === feature.imageId);
            return (
              <Card key={feature.title} className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
                {image && (
                  <div className="aspect-video relative">
                    <Image
                      src={image.imageUrl}
                      alt={feature.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      data-ai-hint={image.imageHint}
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
