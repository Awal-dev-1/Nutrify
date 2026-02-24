import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export function Hero() {
  const heroImage = PlaceHolderImages.find(
    (img) => img.id === "hero-background"
  );

  return (
    <section className="relative h-[60vh] min-h-[500px] w-full">
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
      <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-primary/50 to-background/10"></div>
      <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-primary-foreground">
        <div className="container max-w-4xl">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl lg:text-7xl">
            Eat Smart. Live Healthy.
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl">
            Discover the rich world of Ghanaian cuisine and take control of your
            health. Nutrify helps you understand, track, and improve your diet
            with smart, AI-powered tools.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/signup">Get Started for Free</Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
