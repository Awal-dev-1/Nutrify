
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addFoodToLog } from '@/services/trackerService';
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
import { Loader2, Plus, Flame, Beef, Wheat, Droplets, Minus } from 'lucide-react';
import type { FoodItem } from '@/types/food';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface FoodConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  foodItem: FoodItem | null;
}

export function FoodConfirmationModal({ isOpen, onClose, foodItem }: FoodConfirmationModalProps) {
  const [quantity, setQuantity] = useState(100);
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
      setIsAdding(false);
    }
  }, [isOpen, foodItem]);

  const handleAddToTracker = async () => {
    if (!foodItem || !user || !db) return;
    setIsAdding(true);
    try {
      const per100gRatio = 100 / (foodItem.estimatedWeightGrams || 100);
      const foodDataForService: FoodItem = {
        ...foodItem,
        estimatedWeightGrams: 100,
        calories: foodItem.calories * per100gRatio,
        macronutrientBreakdown: {
          protein: foodItem.macronutrientBreakdown.protein * per100gRatio,
          carbohydrates: foodItem.macronutrientBreakdown.carbohydrates * per100gRatio,
          fat: foodItem.macronutrientBreakdown.fat * per100gRatio,
        },
        micronutrientBreakdown: {
          fiber: (foodItem.micronutrientBreakdown?.fiber || 0) * per100gRatio,
          sugar: (foodItem.micronutrientBreakdown?.sugar || 0) * per100gRatio,
          iron: (foodItem.micronutrientBreakdown?.iron || 0) * per100gRatio,
          calcium: (foodItem.micronutrientBreakdown?.calcium || 0) * per100gRatio,
          vitaminA: (foodItem.micronutrientBreakdown?.vitaminA || 0) * per100gRatio,
          vitaminC: (foodItem.micronutrientBreakdown?.vitaminC || 0) * per100gRatio,
          sodium: (foodItem.micronutrientBreakdown?.sodium || 0) * per100gRatio,
          vitaminD: (foodItem.micronutrientBreakdown?.vitaminD || 0) * per100gRatio,
          vitaminE: (foodItem.micronutrientBreakdown?.vitaminE || 0) * per100gRatio,
          vitaminK: (foodItem.micronutrientBreakdown?.vitaminK || 0) * per100gRatio,
          vitaminB1: (foodItem.micronutrientBreakdown?.vitaminB1 || 0) * per100gRatio,
          vitaminB2: (foodItem.micronutrientBreakdown?.vitaminB2 || 0) * per100gRatio,
          vitaminB3: (foodItem.micronutrientBreakdown?.vitaminB3 || 0) * per100gRatio,
          vitaminB6: (foodItem.micronutrientBreakdown?.vitaminB6 || 0) * per100gRatio,
          vitaminB12: (foodItem.micronutrientBreakdown?.vitaminB12 || 0) * per100gRatio,
          folate: (foodItem.micronutrientBreakdown?.folate || 0) * per100gRatio,
          magnesium: (foodItem.micronutrientBreakdown?.magnesium || 0) * per100gRatio,
          potassium: (foodItem.micronutrientBreakdown?.potassium || 0) * per100gRatio,
          zinc: (foodItem.micronutrientBreakdown?.zinc || 0) * per100gRatio,
        },
      };

      await addFoodToLog(db, user.uid, mealType, foodDataForService, quantity);

      toast({
        title: 'Success!',
        description: `${foodItem.foodName} has been added to your tracker.`,
      });
      router.push('/dashboard/tracker');
      onClose();
    } catch (err: any) {
      console.error('Failed to add food to log:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add food to your tracker.',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const calculatedNutrients = foodItem
    ? {
        calories: (foodItem.calories / (foodItem.estimatedWeightGrams || 1)) * quantity,
        protein: (foodItem.macronutrientBreakdown.protein / (foodItem.estimatedWeightGrams || 1)) * quantity,
        carbs: (foodItem.macronutrientBreakdown.carbohydrates / (foodItem.estimatedWeightGrams || 1)) * quantity,
        fat: (foodItem.macronutrientBreakdown.fat / (foodItem.estimatedWeightGrams || 1)) * quantity,
      }
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-lg w-full">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Add to Daily Log</DialogTitle>
          <DialogDescription className="text-sm">
            Review the details for <span className="font-semibold text-primary">{foodItem?.foodName}</span> and add it to your tracker.
          </DialogDescription>
        </DialogHeader>

        {foodItem && calculatedNutrients && (
          <div className="grid gap-4 sm:gap-6 py-4">
            
            <div className="p-3 sm:p-4 rounded-xl border bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground text-sm sm:text-base">Nutritional Estimate</h3>
                <Badge variant="outline">{quantity}g</Badge>
              </div>
              <div className="grid grid-cols-4 gap-1 sm:gap-2 text-center">
                <div>
                  <Flame className="mx-auto h-4 sm:h-5 w-4 sm:w-5 text-orange-500" />
                  <p className="font-bold text-base sm:text-lg">{calculatedNutrients.calories.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">kcal</p>
                </div>
                <div>
                  <Beef className="mx-auto h-4 sm:h-5 w-4 sm:w-5 text-red-500" />
                  <p className="font-bold text-base sm:text-lg">{calculatedNutrients.protein.toFixed(1)}g</p>
                  <p className="text-xs text-muted-foreground">Protein</p>
                </div>
                <div>
                  <Wheat className="mx-auto h-4 sm:h-5 w-4 sm:w-5 text-yellow-600" />
                  <p className="font-bold text-base sm:text-lg">{calculatedNutrients.carbs.toFixed(1)}g</p>
                  <p className="text-xs text-muted-foreground">Carbs</p>
                </div>
                <div>
                  <Droplets className="mx-auto h-4 sm:h-5 w-4 sm:w-5 text-blue-500" />
                  <p className="font-bold text-base sm:text-lg">{calculatedNutrients.fat.toFixed(1)}g</p>
                  <p className="text-xs text-muted-foreground">Fat</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-sm">Adjust Portion Size (grams)</Label>
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
              <div className="space-y-2">
                <Label htmlFor="mealType" className="text-sm">Add to Meal</Label>
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
            </div>
          </div>
        )}

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-0">
          <Button onClick={onClose} variant="outline" disabled={isAdding} className="w-full sm:w-auto h-11">
            Cancel
          </Button>
          <Button onClick={handleAddToTracker} disabled={isAdding || !foodItem} className="w-full sm:w-auto h-11">
            {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Add to Tracker
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
