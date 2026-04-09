
'use client';

import { History, Bot, Flame, ChevronRight, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import type { RecentSearch } from '@/types/search';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteRecentSearch } from '@/services/searchService';
import { useUser, useFirestore } from '@/firebase';
import { motion, AnimatePresence } from 'framer-motion';

interface RecentSearchesProps {
  recents: RecentSearch[] | null;
  isLoading: boolean;
  onRecentClick: (recent: RecentSearch) => void;
}

export function RecentSearches({ recents, isLoading, onRecentClick }: RecentSearchesProps) {
  const { user } = useUser();
  const db = useFirestore();

  const handleDelete = (searchId: string) => {
    if (!user || !db) return;
    deleteRecentSearch(db, user.uid, searchId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-1" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
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
      <CardContent className="p-0">
        <div className="space-y-0">
          <AnimatePresence initial={false}>
            {recents.map((recent) => (
              <motion.div
                key={recent.id}
                layout
                initial={{ opacity: 1, height: 'auto' }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0, transition: { duration: 0.3 } }}
                className="border-t"
              >
                <div
                  className="w-full text-left p-4 hover:bg-muted/50 transition-colors flex justify-between items-center group cursor-pointer"
                  onClick={() => onRecentClick(recent)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{recent.foodName}</p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        <Flame className="h-3.5 w-3.5 text-orange-500" />
                        <span>{Math.round(recent.calories)} kcal</span>
                    </div>
                  </div>
                  <div className="flex items-center shrink-0">
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Delete search for ${recent.foodName}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Search History?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove "{recent.foodName}" from your history? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(recent.id);
                            }}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/60 transition-colors ml-0" />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
