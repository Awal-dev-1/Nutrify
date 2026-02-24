import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary"
      >
        <path
          d="M16 2.66663C8.63636 2.66663 2.66669 8.63629 2.66669 16C2.66669 23.3636 8.63636 29.3333 16 29.3333C23.3637 29.3333 29.3334 23.3636 29.3334 16C29.3334 8.63629 23.3637 2.66663 16 2.66663Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10.6667 13.3333C10.6667 13.3333 12 10.6666 16 10.6666C20 10.6666 21.3334 13.3333 21.3334 13.3333"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M11.5146 20.3066C12.3601 21.9056 14.072 22.9258 16.0001 22.9258C17.9281 22.9258 19.64 21.9056 20.4855 20.3066"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <span className="text-xl font-bold tracking-tight text-foreground">
        Nutrify
      </span>
    </div>
  );
}
