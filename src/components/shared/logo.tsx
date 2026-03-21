import { cn } from "@/lib/utils";

export function Logo({ className, collapsed }: { className?: string; collapsed?: boolean }) {
  return (
    <div className={cn("flex items-center", className)}>
      <span className={cn("font-bold tracking-tight text-primary", 
        collapsed ? "text-2xl" : "text-xl md:text-2xl"
      )}>
        {collapsed ? 'N' : 'Nutrify'}
      </span>
    </div>
  );
}
