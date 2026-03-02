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
import { Loader2, Plus, Flame, Beef, Wheat, Droplets } from 'lucide-react';
import type { FoodItem } from '@/types/food';

interface FoodConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  foodItem: FoodItem | null;
}

export function FoodConfirmationModal({ isOpen, onClose, foodItem }: FoodConfirmationModalProps) {
  const [quantity, setQuantity] = useState(100);
  const [mealType, setMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks'>('Lunch');
  const [isAdding, setIsAdding] = useState(false);

  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    // Reset state when modal opens or food item changes
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
      // The addFoodToLog service expects nutrients per 100g.
      // We need to normalize the data from our portion-based AI result
      // back to a 100g-equivalent FoodItem.
      const per100gRatio = 100 / (foodItem.estimatedWeightGrams || 100);
      const foodDataForService: FoodItem = {
          ...foodItem,
          // We don't need to pass estimatedWeightGrams to the service
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
          }
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
  
  const calculatedNutrients = foodItem ? {
      calories: (foodItem.calories / (foodItem.estimatedWeightGrams || 1)) * quantity,
      protein: (foodItem.macronutrientBreakdown.protein / (foodItem.estimatedWeightGrams || 1)) * quantity,
      carbs: (foodItem.macronutrientBreakdown.carbohydrates / (foodItem.estimatedWeightGrams || 1)) * quantity,
      fat: (foodItem.macronutrientBreakdown.fat / (foodItem.estimatedWeightGrams || 1)) * quantity,
  } : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm & Add Food</DialogTitle>
          <DialogDescription>
            Verify the details for {foodItem?.foodName} and add it to your daily tracker.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {foodItem && calculatedNutrients && (
            <div className="space-y-4 animate-in fade-in-50">
              <div className='p-4 rounded-lg border bg-muted/50'>
                <h3 className="font-bold">{foodItem.foodName}</h3>
                <p className="text-xs text-muted-foreground">Nutritional estimate for {quantity}g</p>
                <div className='mt-3 flex justify-around text-center'>
                    <div>
                        <Flame className='mx-auto h-5 w-5 text-orange-500' />
                        <p className='font-bold text-lg'>{calculatedNutrients.calories.toFixed(0)}</p>
                        <p className='text-xs text-muted-foreground'>kcal</p>
                    </div>
                    <div>
                        <Beef className='mx-auto h-5 w-5 text-red-500' />
                        <p className='font-bold text-lg'>{calculatedNutrients.protein.toFixed(1)}g</p>
                        <p className='text-xs text-muted-foreground'>Protein</p>
                    </div>
                    <div>
                        <Wheat className='mx-auto h-5 w-5 text-yellow-600' />
                        <p className='font-bold text-lg'>{calculatedNutrients.carbs.toFixed(1)}g</p>
                        <p className='text-xs text-muted-foreground'>Carbs</p>
                    </div>
                    <div>
                        <Droplets className='mx-auto h-5 w-5 text-blue-500' />
                        <p className='font-bold text-lg'>{calculatedNutrients.fat.toFixed(1)}g</p>
                        <p className='text-xs text-muted-foreground'>Fat</p>
                    </div>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="quantity" className="text-sm font-medium">Quantity (grams)</label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="mealType" className="text-sm font-medium">Meal</label>
                <Select value={mealType} onValueChange={(v) => setMealType(v as any)}>
                  <SelectTrigger id="mealType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Breakfast">Breakfast</SelectItem>
                    <SelectItem value="Lunch">Lunch</SelectItem>
                    <SelectItem value="Dinner">Dinner</SelectItem>
                    <SelectItem value="Snacks">Snacks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline" disabled={isAdding}>
            Cancel
          </Button>
          <Button onClick={handleAddToTracker} disabled={isAdding || !foodItem}>
            {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Add to Tracker
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
