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
import { Badge } from '@/components/ui/badge';
import type { Recommendation } from '@/lib/recommendations-data';
import { ScrollArea } from '../ui/scroll-area';

interface RecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendation: Recommendation | null;
}

export function RecipeModal({
  isOpen,
  onClose,
  recommendation,
}: RecipeModalProps) {
  if (!recommendation) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{recommendation.name}</DialogTitle>
          <DialogDescription>
            {recommendation.description}
          </DialogDescription>
          <div className="flex flex-wrap gap-2 pt-2">
            {recommendation.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
            <div className="grid md:grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
                <h3 className="font-semibold text-lg">Ingredients</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {recommendation.recipe.ingredients.map((ing, i) => (
                    <li key={i}>{ing}</li>
                ))}
                </ul>
            </div>
            <div className="space-y-4">
                <h3 className="font-semibold text-lg">Instructions</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                {recommendation.recipe.instructions.map((step, i) => (
                    <li key={i}>{step}</li>
                ))}
                </ol>
            </div>
            </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
