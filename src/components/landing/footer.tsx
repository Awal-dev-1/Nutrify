import { Logo } from "@/components/shared/logo";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-gradient-to-b from-background to-muted/20">
      <div className="container py-12 md:py-16">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <Logo />
            <p className="text-xs text-muted-foreground/80">
              Making healthy eating simple
            </p>
          </div>
          
          <p className="text-sm text-muted-foreground/70">
            © {new Date().getFullYear()} Nutrify. All rights reserved.
          </p>
        </div>
        
      </div>
    </footer>
  );
}