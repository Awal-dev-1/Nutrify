
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ReactNode } from "react";

interface SettingsCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function SettingsCard({ title, description, icon, children, footer }: SettingsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 px-4 sm:px-6 py-4 sm:py-6">
        <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
            {icon}
        </div>
        <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
        {children}
      </CardContent>
      {footer && (
        <CardFooter className="bg-muted/30 px-4 sm:px-6 py-3 sm:py-4 border-t flex justify-end">
            {footer}
        </CardFooter>
      )}
    </Card>
  );
}
