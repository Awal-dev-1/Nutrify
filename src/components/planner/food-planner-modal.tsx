
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addPlannedMeal } from '@/services/plannerService';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Utensils, Minus } from 'lucide-react';
import type { FoodItem } from '@/types/food';
import { Label } from '@/components/ui/label';

interface FoodPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  foodItem: FoodItem | null;
}

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function FoodPlannerModal({ isOpen, onClose, foodItem }: FoodPlannerModalProps) {
  const [quantity, setQuantity] = useState(100);
  const [day, setDay] = useState('Monday');
  const [mealType, setMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner'>('Lunch');
  const [isAdding, setIsAdding] = useState(false);

  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (isOpen && foodItem) {
      setQuantity(foodItem.estimatedWeightGrams || 100);
      setMealType('Lunch');
      setDay('Monday');
      setIsAdding(false);
    }
  }, [isOpen, foodItem]);

  const handleAddToPlanner = async () => {
    if (!foodItem || !user || !db) return;
    setIsAdding(true);
    try {
      // The addPlannedMeal service already handles the nutrient calculation based on quantity.
      addPlannedMeal(db, user.uid, day, mealType, foodItem, quantity);

      toast({
        title: 'Success!',
        description: `${foodItem.foodName} has been added to your meal plan for ${day}.`,
      });
      router.push('/dashboard/planner');
      onClose();
    } catch (err: any) {
      console.error('Failed to add food to planner:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add food to your meal plan.',
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-lg w-full">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Add to Meal Plan</DialogTitle>
          <DialogDescription className="text-sm">
            Plan to eat <span className="font-semibold text-primary">{foodItem?.foodName}</span> on a future day.
          </DialogDescription>
        </DialogHeader>

        {foodItem && (
          <div className="grid gap-4 sm:gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="day" className="text-sm">Day of the Week</Label>
              <Select value={day} onValueChange={setDay}>
                <SelectTrigger id="day" className="h-11 sm:h-12 text-base">
                  <SelectValue placeholder="Select a day" />
                </SelectTrigger>
                <SelectContent>
                  {daysOfWeek.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mealType" className="text-sm">Meal</Label>
              <Select value={mealType} onValueChange={(v) => setMealType(v as any)}>
                <SelectTrigger id="mealType" className="h-11 sm:h-12 text-base">
                  <SelectValue placeholder="Select a meal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Breakfast">Breakfast</SelectItem>
                  <SelectItem value="Lunch">Lunch</SelectItem>
                  <SelectItem value="Dinner">Dinner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-sm">Portion Size (grams)</Label>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setQuantity(q => Math.max(10, q - 10))}>
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="text-center text-base sm:text-lg h-11 sm:h-12"
                />
                <Button variant="outline" size="icon" onClick={() => setQuantity(q => q + 10)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-0">
          <Button onClick={onClose} variant="outline" disabled={isAdding} className="w-full sm:w-auto h-11">
            Cancel
          </Button>
          <Button onClick={handleAddToPlanner} disabled={isAdding || !foodItem} className="w-full sm:w-auto h-11">
            {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Utensils className="mr-2 h-4 w-4" />}
            Save to Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
