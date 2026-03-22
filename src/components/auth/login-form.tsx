
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, useToast, useFirestore } from "@/hooks";
import { login, signInWithGoogle } from "@/services/authService";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.05 1.05-2.36 1.67-4.66 1.67-3.86 0-6.99-3.14-6.99-7s3.13-7 6.99-7c2.03 0 3.45.78 4.27 1.58l2.5-2.5C17.96 2.67 15.22 1 12.48 1 7.03 1 3 5.03 3 10.5S7.03 20 12.48 20c2.9 0 5.25-.97 6.92-2.63 1.8-1.75 2.56-4.25 2.56-6.75 0-.64-.06-1.28-.18-1.89H12.48z"
      />
    </svg>
);

export function LoginForm() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await login(auth, values.email, values.password);
      // The parent page (`/login`) is responsible for handling the redirect
      // after the auth state changes. This component just handles the login action.
    } catch (error: any) {
      let description = "An unexpected error occurred. Please try again.";
      
      // Handle specific Firebase Auth errors for a better user experience.
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        description = "No account found with this email address. You need to create an account.";
      } else if (error.code === 'auth/wrong-password') {
        description = "Incorrect password. Please try again.";
      } else {
        description = error.message || description;
      }

      toast({
        variant: "destructive",
        title: "Login Failed",
        description: description,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
        await signInWithGoogle(auth, db);
    } catch (error: any) {
        if (error.code === 'auth/popup-closed-by-user') {
            return; // User cancelled, do nothing.
        }
        
        let description = "Could not sign in with Google. Please try again.";
        if (error.code === 'auth/operation-not-allowed') {
            description = "Google Sign-In is not enabled for this project. Please contact support.";
        }

        toast({
            variant: "destructive",
            title: "Sign-In Failed",
            description: description,
        });
    } finally {
        setIsGoogleLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-h3">Login</CardTitle>
        <CardDescription>
          Welcome back! Please enter your details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                   <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                    <Link href="#" className="text-small font-medium text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login
            </Button>
          </form>
        </Form>
        <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                Or continue with
                </span>
            </div>
        </div>
        <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isLoading || isGoogleLoading}
        >
            {isGoogleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <GoogleIcon className="mr-2 h-4 w-4" />
            )}
            Google
        </Button>
        <div className="mt-4 text-center text-small">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="underline">
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
