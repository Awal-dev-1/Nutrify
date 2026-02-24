import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CtaBanner() {
  return (
    <section className="bg-primary/90 text-primary-foreground">
      <div className="container py-12 text-center md:py-20">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          Start your journey to better nutrition today.
        </h2>
        <p className="mt-4 text-lg text-primary-foreground/80">
          Sign up now and get immediate access to all our smart features.
        </p>
        <div className="mt-8">
          <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="/signup">Sign Up for Free</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
