import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="container flex h-16 items-center justify-between">
        <Logo />
        
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            asChild 
            className="rounded-full px-5 hover:bg-primary/5 hover:text-primary transition-all duration-200"
          >
            <Link href="/login">Login</Link>
          </Button>
          
          <Button 
            asChild 
            className="rounded-full bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
          >
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}