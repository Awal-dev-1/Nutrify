"use client";

import { useState, useMemo } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { mockFoods, type Food } from "@/lib/data";
import { useDebounce } from "@/hooks/use-debounce";
import { Plus, Search } from "lucide-react";

type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snacks";

interface AddFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFood: (food: Food, quantity: number, mealType: MealType) => void;
  mealType: MealType | null;
}

export function AddFoodModal({ isOpen, onClose, onAddFood, mealType }: AddFoodModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState(100);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const searchResults = useMemo(() => {
    if (!debouncedSearch) return mockFoods.slice(0, 10); // Show some initial items
    return mockFoods.filter((food) =>
      food.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [debouncedSearch]);

  const handleAdd = () => {
    if (selectedFood && mealType) {
      onAddFood(selectedFood, quantity, mealType);
      resetAndClose();
    }
  };

  const resetAndClose = () => {
    setSelectedFood(null);
    setSearchQuery("");
    setQuantity(100);
    onClose();
  }

  if (!mealType) return null;

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Food to {mealType}</DialogTitle>
          {!selectedFood && <DialogDescription>Search for a food item to add to your meal.</DialogDescription>}
        </DialogHeader>

        {selectedFood ? (
            <div className="py-4 space-y-4">
                 <div className="flex items-center gap-4 p-2 rounded-lg bg-muted">
                    <div className="flex-grow">
                        <p className="font-semibold">{selectedFood.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedFood.calories} kcal per 100g</p>
                    </div>
                </div>
                 <div className="space-y-2">
                    <label htmlFor="quantity" className="text-sm font-medium">Quantity (grams)</label>
                    <Input id="quantity" type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
                </div>
            </div>
        ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search foods..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <ScrollArea className="h-64 mt-4">
            <div className="space-y-2">
              {searchResults.map((food) => (
                <div
                  key={food.id}
                  className="flex items-center gap-4 p-2 rounded-lg cursor-pointer hover:bg-muted"
                  onClick={() => setSelectedFood(food)}
                >
                  <div>
                    <p className="font-medium">{food.name}</p>
                    <p className="text-sm text-muted-foreground">{food.calories} kcal</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </>
        )}

        <DialogFooter>
            {selectedFood && <Button variant="ghost" onClick={() => setSelectedFood(null)}>Back to search</Button>}
            <Button onClick={resetAndClose} variant="outline">Cancel</Button>
            <Button onClick={handleAdd} disabled={!selectedFood}>
                <Plus className="mr-2 h-4 w-4" /> Add Item
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
