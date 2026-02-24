import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export function Hero() {
  const heroImage = PlaceHolderImages.find(
    (img) => img.id === "hero-background"
  );

  return (
    <section className="relative h-[80vh] min-h-[600px] w-full overflow-hidden">
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
        </>
      )}
      
      <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white px-4">
        <div className="container max-w-5xl mx-auto space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center rounded-full bg-white/10 backdrop-blur-sm px-4 py-1.5 text-sm border border-white/20">
            <span className="flex h-2 w-2 rounded-full bg-green-400 mr-2 animate-pulse" />
            AI-Powered Nutrition Tracking
          </div>
          
          {/* Main Heading */}
          <h1 className="text-5xl font-bold tracking-tight md:text-7xl lg:text-8xl">
            Eat Smart.
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-green-400 to-green-500">
              Live Healthy.
            </span>
          </h1>
          
          {/* Description */}
          <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            Discover the rich world of Ghanaian cuisine and take control of your
            health. Nutrify helps you understand, track, and improve your diet
            with smart, AI-powered tools.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Button 
              size="lg" 
              asChild 
              className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 hover:scale-105 transition-all duration-300 px-8 py-6 text-lg rounded-full"
            >
              <Link href="/signup">Get Started for Free</Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              asChild 
              className="border-white/20 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 hover:border-white/30 px-8 py-6 text-lg rounded-full transition-all duration-300"
            >
              <Link href="/login">Login</Link>
            </Button>
          </div>
          
         
        </div>
      </div>
    </section>
  );
}