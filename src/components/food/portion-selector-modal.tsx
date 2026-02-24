"use client";

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
import { Label } from "@/components/ui/label";
import type { Food } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Scale, UtensilsCrossed, Beef, Wheat, Droplets, Flame } from "lucide-react";

interface PortionSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  food: Food;
}

export function PortionSelectorModal({
  isOpen,
  onClose,
  food,
}: PortionSelectorModalProps) {
  const { toast } = useToast();

  const handleAdd = () => {
    toast({
      title: "Food Added!",
      description: `${food.name} has been added to your daily tracker.`,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-primary/10">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">{food.name}</DialogTitle>
              <DialogDescription className="text-sm">
                Add to your daily tracker
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Portion Size */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Scale className="h-4 w-4 text-muted-foreground" />
              <span>Portion size</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Input 
                  id="portion" 
                  defaultValue="100" 
                  className="pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  grams
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm font-medium">
                <Flame className="h-4 w-4 text-orange-500" />
                <span>{food.calories} kcal</span>
              </div>
            </div>
          </div>

          {/* Quick Portions */}
          <div className="flex gap-2">
            {[50, 100, 150, 200].map((grams) => (
              <Button
                key={grams}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                {grams}g
              </Button>
            ))}
          </div>

          {/* Meal Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
              <span>Add to meal</span>
            </div>
            <Select defaultValue="lunch">
              <SelectTrigger>
                <SelectValue placeholder="Select a meal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
                <SelectItem value="snacks">Snacks</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Nutrition Summary */}
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground mb-3">
              Nutrition facts (per 100g)
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-red-500">
                  <Beef className="h-3.5 w-3.5" />
                  <span className="text-xs text-muted-foreground">Protein</span>
                </div>
                <p className="font-medium">{food.protein}g</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-yellow-600">
                  <Wheat className="h-3.5 w-3.5" />
                  <span className="text-xs text-muted-foreground">Carbs</span>
                </div>
                <p className="font-medium">{food.carbs}g</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-blue-500">
                  <Droplets className="h-3.5 w-3.5" />
                  <span className="text-xs text-muted-foreground">Fat</span>
                </div>
                <p className="font-medium">{food.fat}g</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
            Cancel
          </Button>
          <Button onClick={handleAdd} className="flex-1 sm:flex-none">
            Add to Tracker
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}