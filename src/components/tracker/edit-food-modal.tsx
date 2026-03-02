
'use client';

import { useState, useEffect } from 'react';
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

type EditableFoodItem = {
    logId: string;
    quantity: number;
}

interface EditFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (logId: string, newQuantity: number) => void;
  loggedFood: EditableFoodItem | null;
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

  const handleUpdate = () => {
    if (loggedFood) {
      onUpdate(loggedFood.logId, quantity);
      onClose();
    }
  };

  if (!loggedFood) return null;
  
  // Note: We can't calculate calories here as this component doesn't have access to the full food item details.
  // This is a simplification for the planner context. A full implementation might fetch food details.

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Portion</DialogTitle>
          <DialogDescription>
            Update the quantity for this meal item.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
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

    