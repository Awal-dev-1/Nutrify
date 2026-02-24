import { Logo } from "@/components/shared/logo";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary/50 p-4">
       <div className="absolute top-6 left-6">
        <Link href="/">
          <Logo />
        </Link>
      </div>
      {children}
    </div>
  );
}
