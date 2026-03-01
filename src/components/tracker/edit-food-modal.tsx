'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { LoggedFoodItem } from '@/types/analytics';
import { mockFoods } from '@/lib/data';

interface EditFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (logId: string, newQuantity: number) => void;
  loggedFood: LoggedFoodItem | null;
}

export function EditFoodModal({
  isOpen,
  onClose,
  onUpdate,
  loggedFood,
}: EditFoodModalProps) {
  const [quantity, setQuantity] = useState(loggedFood?.quantity || 100);

  useEffect(() => {
    if (loggedFood) {
      setQuantity(loggedFood.quantity);
    }
  }, [loggedFood]);

  const foodDetails = useMemo(() => {
    return mockFoods.find(f => f.id === loggedFood?.foodId);
  }, [loggedFood]);

  const handleUpdate = () => {
    if (loggedFood) {
      onUpdate(loggedFood.logId, quantity);
      onClose();
    }
  };

  if (!loggedFood || !foodDetails) return null;
  
  const calculatedCalories = (foodDetails.calories / 100) * quantity;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Portion</DialogTitle>
          <DialogDescription>
            Update the quantity for {loggedFood.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex items-center gap-4 p-2 rounded-lg bg-muted">
            <div className="flex-grow">
              <p className="font-semibold">{loggedFood.name}</p>
              <p className="text-sm text-muted-foreground">
                Original: {loggedFood.quantity}g ({Math.round(loggedFood.calories)} kcal)
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="quantity" className="text-sm font-medium">
              New Quantity (grams)
            </label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
             <p className="text-sm text-muted-foreground text-right">
                Estimated: {Math.round(calculatedCalories)} kcal
              </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleUpdate}>Update Portion</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
