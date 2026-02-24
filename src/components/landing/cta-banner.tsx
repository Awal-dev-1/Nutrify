import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CtaBanner() {
  return (
    <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
      <div className="container px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Start your journey to better nutrition today.
          </h2>
          <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
            Sign up now and get immediate access to all our smart features.
          </p>
          <div className="pt-4">
            <Button 
              size="lg" 
              asChild 
              className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Link href="/signup">Sign Up for Free</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}