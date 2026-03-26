
// components/landing/footer.tsx
import { Logo } from "@/components/shared/logo";
import { TransitionLink } from "@/components/shared/transition-link";
import { Heart, Github, Twitter, Instagram } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-gradient-to-b from-background to-muted/20">
      <div className="container px-4 py-12 md:py-16">
        <div className="flex flex-col items-center justify-center text-center space-y-6">
          {/* Brand */}
          <div className="flex flex-col items-center justify-center gap-4">
            <Logo />
            <p className="text-sm text-muted-foreground/80 max-w-md mx-auto">
              Making healthy eating simple with AI-powered nutrition tracking, 
              personalized recommendations, and a rich database of Ghanaian foods.
            </p>
          </div>
          
          {/* Social Links */}
          <div className="flex items-center gap-4">
            <TransitionLink href="#" className="p-2 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
              <Twitter className="h-5 w-5" />
            </TransitionLink>
            <TransitionLink href="#" className="p-2 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
              <Instagram className="h-5 w-5" />
            </TransitionLink>
            <TransitionLink href="#" className="p-2 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
              <Github className="h-5 w-5" />
            </TransitionLink>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t text-center">
          <p className="text-sm text-muted-foreground/70">
            © {new Date().getFullYear()} Nutrify. All rights reserved. Made with{" "}
            <Heart className="inline h-3.5 w-3.5 text-red-500 fill-red-500" /> in Ghana.
          </p>
        </div>
      </div>
    </footer>
  );
}
