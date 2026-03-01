'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { searchFoods, type FoodItem as AiFoodItem } from '@/ai/flows/search-foods-flow';
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
import { Loader2, AlertCircle, Plus, Flame, Beef, Wheat, Droplets, UtensilsCrossed } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface FoodConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  foodName: string | null;
}

export function FoodConfirmationModal({ isOpen, onClose, foodName }: FoodConfirmationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foodData, setFoodData] = useState<AiFoodItem | null>(null);
  const [quantity, setQuantity] = useState(100);
  const [mealType, setMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks'>('Lunch');
  const [isAdding, setIsAdding] = useState(false);

  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (isOpen && foodName) {
      const fetchFoodData = async () => {
        setLoading(true);
        setError(null);
        setFoodData(null);
        try {
          const response = await searchFoods({ query: foodName });
          if (!response.isFoodQuery || response.foodItems.length === 0) {
            throw new Error('Could not retrieve nutritional details for this item.');
          }
          setFoodData(response.foodItems[0]);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchFoodData();
    }
  }, [isOpen, foodName]);

  const handleAddToTracker = async () => {
    if (!foodData || !user || !db) return;
    setIsAdding(true);
    try {
      await addFoodToLog(db, user.uid, mealType, foodData, quantity);
      toast({
        title: 'Success!',
        description: `${foodData.foodName} has been added to your tracker.`,
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
  
  const calculatedNutrients = foodData ? {
      calories: foodData.calories * (quantity / 100),
      protein: foodData.macronutrientBreakdown.protein * (quantity / 100),
      carbs: foodData.macronutrientBreakdown.carbohydrates * (quantity / 100),
      fat: foodData.macronutrientBreakdown.fat * (quantity / 100),
  } : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm & Add Food</DialogTitle>
          <DialogDescription>
            Verify the details and add this item to your daily tracker.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {loading && (
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {foodData && calculatedNutrients && (
            <div className="space-y-4 animate-in fade-in-50">
              <div className='p-4 rounded-lg border bg-muted/50'>
                <h3 className="font-bold">{foodData.foodName}</h3>
                <p className="text-xs text-muted-foreground">AI-generated nutritional estimate</p>
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
                  onChange={(e) => setQuantity(Number(e.target.value))}
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
          <Button onClick={handleAddToTracker} disabled={loading || isAdding || !!error}>
            {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Add to Tracker
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
