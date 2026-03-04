'use client';

import { History, Bot } from 'lucide-react';
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
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
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
              className="w-full text-left p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors flex justify-between items-center"
            >
              <span className="font-medium">{recent.foodName}</span>
              <span className="text-sm text-muted-foreground">{Math.round(recent.calories)} kcal</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
