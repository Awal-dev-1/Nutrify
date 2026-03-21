import { cn } from "@/lib/utils";

export function Logo({ className, collapsed }: { className?: string; collapsed?: boolean }) {
  return (
    <div className={cn("flex items-center", className)}>
      <span className="text-xl font-bold tracking-tight text-primary">
        {collapsed ? 'N' : 'Nutrify'}
      </span>
    </div>
  );
}
