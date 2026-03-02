import { Logo } from "@/components/shared/logo";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-secondary/30 min-h-screen">
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
            <div className="container flex h-16 items-center justify-between">
                <Logo />
                <Button variant="outline" asChild>
                    <Link href="/dashboard/settings">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Settings
                    </Link>
                </Button>
            </div>
        </header>
        <main className="container py-12">
            <div className="max-w-4xl mx-auto bg-card p-8 rounded-lg shadow-sm">
             {children}
            </div>
        </main>
    </div>
  );
}
