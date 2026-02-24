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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quick Add: {food.name}</DialogTitle>
          <DialogDescription>
            Select portion size and meal to add this item to your tracker.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="portion">Portion (in grams)</Label>
            <Input id="portion" defaultValue="100" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meal-type">Add to</Label>
            <Select defaultValue="lunch">
              <SelectTrigger id="meal-type">
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd}>Add to Tracker</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
