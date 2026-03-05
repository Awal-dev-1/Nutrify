// components/landing/footer.tsx
import { Logo } from "@/components/shared/logo";
import Link from "next/link";
import { Heart, Github, Twitter, Instagram } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-gradient-to-b from-background to-muted/20">
      <div className="container px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <Logo />
            <p className="text-xs sm:text-sm text-muted-foreground/80 max-w-md">
              Making healthy eating simple with AI-powered nutrition tracking, 
              personalized recommendations, and a rich database of Ghanaian foods.
            </p>
            <div className="flex items-center gap-3">
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              {["Features", "How It Works", "Pricing", "FAQ"].map((item) => (
                <li key={item}>
                  <Link 
                    href={`#${item.toLowerCase().replace(" ", "-")}`} 
                    className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Legal</h3>
            <ul className="space-y-2">
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (
                <li key={item}>
                  <Link 
                    href={`/${item.toLowerCase().replace(" ", "-")}`} 
                    className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground/70 text-center sm:text-left">
            © {new Date().getFullYear()} Nutrify. All rights reserved. Made with{" "}
            <Heart className="inline h-3 w-3 text-red-500 fill-red-500" /> in Ghana.
          </p>
        </div>
      </div>
    </footer>
  );
}