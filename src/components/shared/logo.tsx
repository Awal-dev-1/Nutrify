import { cn } from "@/lib/utils";

export function Logo({
  className,
  collapsed,
  size = 'default',
}: {
  className?: string;
  collapsed?: boolean;
  size?: 'default' | 'splash';
}) {
  const sizeClasses = {
    default: "text-xl md:text-2xl",
    splash: "text-4xl md:text-6xl",
  };

  return (
    <div className={cn("flex items-center", className)}>
      <span
        className={cn(
          "font-bold tracking-tight text-primary",
          collapsed ? "text-2xl" : sizeClasses[size]
        )}
      >
        {collapsed ? "N" : "Nutrify"}
      </span>
    </div>
  );
}
