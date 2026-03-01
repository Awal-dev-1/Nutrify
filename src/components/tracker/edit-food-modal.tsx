"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockFoods } from "@/lib/data";
import type { LoggedFood } from "@/lib/tracker-data";

interface EditFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (logId: string, newQuantity: number) => void;
  loggedFood: LoggedFood | null;
}

export function EditFoodModal({ isOpen, onClose, onUpdate, loggedFood }: EditFoodModalProps) {
  const [quantity, setQuantity] = useState(loggedFood?.quantity || 100);

  useEffect(() => {
    if (loggedFood) {
      setQuantity(loggedFood.quantity);
    }
  }, [loggedFood]);

  const foodDetails = loggedFood ? mockFoods.find(f => f.id === loggedFood.foodId) : null;

  const handleUpdate = () => {
    if (loggedFood) {
      onUpdate(loggedFood.logId, quantity);
      onClose();
    }
  };

  if (!loggedFood || !foodDetails) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Portion</DialogTitle>
          <DialogDescription>
            Update the quantity for {foodDetails.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <div className="flex items-center gap-4 p-2 rounded-lg bg-muted">
                <div className="flex-grow">
                    <p className="font-semibold">{foodDetails.name}</p>
                    <p className="text-sm text-muted-foreground">{foodDetails.calories} kcal per 100g</p>
                </div>
            </div>
            <div className="space-y-2">
                <label htmlFor="quantity" className="text-sm font-medium">New Quantity (grams)</label>
                <Input id="quantity" type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
            </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">Cancel</Button>
          <Button onClick={handleUpdate}>Update Portion</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
