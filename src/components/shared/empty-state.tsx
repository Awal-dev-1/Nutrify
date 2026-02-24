import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ServerCrash } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
}

export function EmptyState({
  icon = <ServerCrash className="h-16 w-16 text-muted-foreground" />,
  title,
  description,
}: EmptyStateProps) {
  return (
    <Card className="flex items-center justify-center p-8 border-dashed h-80">
      <div className="text-center">
        {icon}
        <h3 className="mt-4 text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
    </Card>
  );
}
