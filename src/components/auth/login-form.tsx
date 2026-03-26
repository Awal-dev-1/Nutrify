
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { TransitionLink } from "@/components/shared/transition-link";
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
import { login } from "@/services/authService";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export function LoginForm() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

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
      } else if (error.code === 'auth/operation-not-allowed') {
        description = "Email/password accounts are not enabled. Please contact support.";
      }
      else {
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
                    <Input placeholder="mohammed@example.com" {...field} />
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
                    <TransitionLink href="#" className="text-small font-medium text-primary hover:underline">
                      Forgot password?
                    </TransitionLink>
                  </div>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-small">
          Don&apos;t have an account?{" "}
          <TransitionLink href="/signup" className="underline">
            Sign up
          </TransitionLink>
        </div>
      </CardContent>
    </Card>
  );
}
