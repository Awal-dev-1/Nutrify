'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Loader2, AlertCircle } from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { FoodItem } from '@/types/food'; // Using the AI version as it includes recipe
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertTitle } from '../ui/alert';

interface RecipeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  foodId: string | null;
}

export function RecipeDetailModal({ isOpen, onClose, foodId }: RecipeDetailModalProps) {
  const db = useFirestore();

  const foodRef = useMemoFirebase(
    () => (foodId ? doc(db, 'foodItems', foodId) : null),
    [db, foodId]
  );
  const { data: food, isLoading, error } = useDoc<FoodItem>(foodRef);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
           <div className="space-y-4">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </div>
      );
    }
    
    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4"/>
                <AlertTitle>Error</AlertTitle>
                <DialogDescription>Could not load recipe details. Please try again later.</DialogDescription>
            </Alert>
        )
    }

    if (!food) {
      return <p className="py-4">No recipe details found.</p>;
    }

    return (
      <div className="py-4 space-y-6">
        <div>
          <h3 className="font-semibold text-lg mb-2">Ingredients</h3>
          <ul className="list-disc list-outside pl-5 space-y-1 text-muted-foreground">
            {food.detailedRecipe.ingredients.map((ingredient, i) => (
              <li key={i}>{ingredient}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-lg mb-2">Instructions</h3>
          <ol className="list-decimal list-outside pl-5 space-y-2 text-muted-foreground">
            {food.detailedRecipe.instructions.map((instruction, i) => (
              <li key={i}>{instruction}</li>
            ))}
          </ol>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          {isLoading || !food ? (
            <>
              <DialogTitle>
                <Skeleton className="h-8 w-3/4" />
              </DialogTitle>
              <DialogDescription asChild>
                <div><Skeleton className="h-4 w-full mt-2" /></div>
              </DialogDescription>
            </>
          ) : (
            <>
              <DialogTitle className="text-2xl">{food.foodName}</DialogTitle>
              {food.foodHistory && <DialogDescription>{food.foodHistory}</DialogDescription>}
            </>
          )}
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
            {renderContent()}
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {/* Add to tracker functionality could be added here if needed */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
