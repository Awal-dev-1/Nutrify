"use client";

import { useState } from "react";
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
import { Plus, Search, Loader2, AlertCircle, Leaf, Flame, Beef, Wheat, Droplets } from "lucide-react";
import { searchFoods } from "@/ai/flows/search-foods-flow";
import type { FoodItem } from '@/types/food';
import { useUser } from "@/firebase";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

type MealType = "Breakfast" | "Lunch" | "Dinner";

interface AddFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFood: (foodData: FoodItem, quantity: number, mealType: MealType) => void;
  mealType: MealType | null;
}

export function AddFoodModal({ isOpen, onClose, onAddFood, mealType }: AddFoodModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState(100);
  const { userProfile } = useUser();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setAiResult(null);

    try {
      const response = await searchFoods({
        query: searchQuery,
        userProfile: userProfile ? { health: userProfile.health } : undefined,
      });

      if (!response.isFoodQuery || response.foodItems.length === 0) {
        throw new Error("Could not find nutritional information for that food.");
      }

      setAiResult(response.foodItems[0]);
    } catch (err: any) {
      setError(err.message || 'Could not fetch AI-powered results.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    if (aiResult && mealType) {
      onAddFood(aiResult, quantity, mealType);
      resetAndClose();
    }
  };

  const resetAndClose = () => {
    setSearchQuery("");
    setLoading(false);
    setError(null);
    setAiResult(null);
    setQuantity(100);
    onClose();
  };

  const resetSearch = () => {
    setSearchQuery("");
    setLoading(false);
    setError(null);
    setAiResult(null);
  };
  
  const calculatedNutrients = aiResult ? {
      calories: (aiResult.calories / (aiResult.estimatedWeightGrams || 100)) * quantity,
      protein: (aiResult.macronutrientBreakdown.protein / (aiResult.estimatedWeightGrams || 100)) * quantity,
      carbs: (aiResult.macronutrientBreakdown.carbohydrates / (aiResult.estimatedWeightGrams || 100)) * quantity,
      fat: (aiResult.macronutrientBreakdown.fat / (aiResult.estimatedWeightGrams || 100)) * quantity,
    } : null;

  if (!mealType) return null;

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Food to {mealType}</DialogTitle>
          <DialogDescription>
            Use AI to search for any food and get its nutritional information.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder='e.g., "Boiled yam with garden egg stew"'
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading || !searchQuery.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </form>

          <div className="min-h-[200px]">
            {loading && (
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/5" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            )}

            {error && !loading && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>AI Search Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {aiResult && !loading && calculatedNutrients && (
              <div className="space-y-4 animate-in fade-in-50">
                <Card>
                   <CardHeader className="p-4">
                    <h3 className="font-bold">{aiResult.foodName}</h3>
                    <p className="text-xs text-muted-foreground">Nutritional estimate for your portion</p>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="p-2 rounded-lg bg-muted/30">
                            <Flame className="mx-auto h-5 w-5 text-orange-500 mb-1"/>
                            <p className="font-bold">{calculatedNutrients.calories.toFixed(0)}</p>
                            <p className="text-xs text-muted-foreground">kcal</p>
                        </div>
                        <div className="p-2 rounded-lg bg-muted/30">
                            <Beef className="mx-auto h-5 w-5 text-red-500 mb-1"/>
                            <p className="font-bold">{calculatedNutrients.protein.toFixed(1)}g</p>
                            <p className="text-xs text-muted-foreground">Protein</p>
                        </div>
                         <div className="p-2 rounded-lg bg-muted/30">
                            <Wheat className="mx-auto h-5 w-5 text-yellow-600 mb-1"/>
                            <p className="font-bold">{calculatedNutrients.carbs.toFixed(1)}g</p>
                            <p className="text-xs text-muted-foreground">Carbs</p>
                        </div>
                         <div className="p-2 rounded-lg bg-muted/30">
                            <Droplets className="mx-auto h-5 w-5 text-blue-500 mb-1"/>
                            <p className="font-bold">{calculatedNutrients.fat.toFixed(1)}g</p>
                            <p className="text-xs text-muted-foreground">Fat</p>
                        </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <label htmlFor="quantity" className="text-sm font-medium">
                    Quantity (grams)
                  </label>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="sm:justify-between pt-4 border-t">
            {aiResult && <Button variant="ghost" onClick={resetSearch}>Search Again</Button>}
            <div className="flex gap-2 ml-auto">
              <Button onClick={resetAndClose} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={!aiResult || loading}>
                <Plus className="mr-2 h-4 w-4" /> Add Item
              </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
