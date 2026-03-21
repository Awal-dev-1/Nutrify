'use client';

import { History, Bot, Flame, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import type { RecentSearch } from '@/types/search';

interface RecentSearchesProps {
  recents: RecentSearch[] | null;
  isLoading: boolean;
  onRecentClick: (recent: RecentSearch) => void;
}

export function RecentSearches({ recents, isLoading, onRecentClick }: RecentSearchesProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-1" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!recents || recents.length === 0) {
    return (
      <EmptyState
        icon={<Bot className="h-16 w-16 text-muted-foreground" />}
        title="Ready to assist"
        description="Your AI nutrition assistant is waiting for your query. Your recent searches will appear here."
        className="border-2 border-dashed"
      />
    );
  }

  return (
    <Card className="animate-in fade-in-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Recent Searches
        </CardTitle>
        <CardDescription>Click an item to view its details again.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {recents.map((recent) => (
            <button
              key={recent.id}
              onClick={() => onRecentClick(recent)}
              className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors flex justify-between items-center group"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium">{recent.foodName}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <Flame className="h-3.5 w-3.5 text-orange-500" />
                    <span>{Math.round(recent.calories)} kcal</span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors ml-2 shrink-0" />
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
