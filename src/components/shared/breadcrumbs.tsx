
"use client";

import { TransitionLink } from "@/components/shared/transition-link";
import { Fragment } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("text-sm", className)}>
      <ol className="flex items-center gap-1.5 text-muted-foreground">
        {items.map((item, index) => (
          <Fragment key={index}>
            <li>
              {item.href ? (
                <TransitionLink
                  href={item.href}
                  className="font-medium text-foreground transition-colors hover:text-primary"
                >
                  {item.label}
                </TransitionLink>
              ) : (
                <span className="font-medium text-foreground">{item.label}</span>
              )}
            </li>
            {index < items.length - 1 && (
              <li>
                <ChevronRight className="h-4 w-4" />
              </li>
            )}
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
