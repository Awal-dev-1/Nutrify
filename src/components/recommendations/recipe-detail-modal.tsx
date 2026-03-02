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
import { PlusCircle } from 'lucide-react';
import type { Recommendation } from '@/services/recommendationService';

interface RecipeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  food: Recommendation | null;
  onAddToCart: (food: Recommendation) => void;
}

export function RecipeDetailModal({ isOpen, onClose, food, onAddToCart }: RecipeDetailModalProps) {
  if (!food) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{food.foodName}</DialogTitle>
          <DialogDescription>{food.foodHistory}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
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
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={() => {
              onAddToCart(food);
              onClose();
            }}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add to Tracker
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
