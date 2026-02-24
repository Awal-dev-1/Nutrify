'use client';

import { useState } from 'react';
import Image from 'next/image';
import { mockFoods, type Food } from '@/lib/data';
import type { PlannedMeal } from '@/lib/planner-data';
import { Button } from '@/components/ui/button';
import { AddFoodModal } from '@/components/tracker/add-food-modal';
import { EditFoodModal } from '@/components/tracker/edit-food-modal';
import { EmptyState } from '../shared/empty-state';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

interface WeekPlannerProps {
    plannedMeals: PlannedMeal[];
    summary: Record<string, {calories: number}>;
    onAddMeal: (food: Food, quantity: number, mealType: string, day: string) => void;
    onUpdateMeal: (id: string, newQuantity: number) => void;
    onRemoveMeal: (id: string) => void;
}

export function WeekPlanner({ plannedMeals, summary, onAddMeal, onUpdateMeal, onRemoveMeal }: WeekPlannerProps) {
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<PlannedMeal | null>(null);
  const [target, setTarget] = useState<{ day: string; mealType: string } | null>(null);
  
  const foodDetailsMap = mockFoods.reduce((acc, food) => {
    acc[food.id] = food;
    return acc;
    }, {} as Record<string, Food>);

  const handleAddClick = (day: string, mealType: string) => {
    setTarget({ day, mealType });
    setAddModalOpen(true);
  };
  
  const handleEditClick = (meal: PlannedMeal) => {
    setEditingMeal(meal);
  };

  const handleAddFood = (food: Food, quantity: number, mealType: string) => {
    if (target) {
      onAddMeal(food, quantity, target.mealType, target.day);
    }
  };
  
  if (plannedMeals.length === 0) {
      return (
          <EmptyState title="No meals planned yet." description="Generate a plan or add meals to get started.">
              <Button onClick={() => handleAddClick('Monday', 'Breakfast')}>
                  <Plus className="mr-2 h-4 w-4" /> Start Planning
              </Button>
               <AddFoodModal
                isOpen={isAddModalOpen}
                onClose={() => setAddModalOpen(false)}
                onAddFood={handleAddFood}
                mealType={target?.mealType as any}
                />
          </EmptyState>
      )
  }

  return (
    <>
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="grid grid-cols-[repeat(7,minmax(200px,1fr))] gap-2">
        {daysOfWeek.map((day) => (
          <div key={day} className="space-y-2">
            <h3 className="text-center font-semibold">{day}</h3>
            <p className="text-center text-sm text-muted-foreground">{Math.round(summary[day]?.calories || 0)} kcal</p>
            {mealTypes.map((mealType) => {
                const mealsForCell = plannedMeals.filter(m => m.day === day && m.mealType === mealType);
                return (
                    <Card key={`${day}-${mealType}`} className="min-h-[150px] flex flex-col">
                        <CardHeader className="p-2">
                            <CardTitle className="text-sm font-medium">{mealType}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-2 space-y-2 flex-grow">
                            {mealsForCell.map(meal => {
                                const food = foodDetailsMap[meal.foodId];
                                if (!food) return null;
                                return (
                                    <div key={meal.id} className="text-xs p-1 rounded-md bg-muted/50 flex items-center justify-between group">
                                       <div className="flex items-center gap-2">
                                            <Image src={food.image} alt={food.name} width={24} height={24} className="rounded-sm object-cover" data-ai-hint={food.imageHint} />
                                            <div className="truncate">
                                                <p className="font-medium truncate">{food.name}</p>
                                                <p className="text-muted-foreground">{meal.quantity}g</p>
                                            </div>
                                       </div>
                                       <div className="hidden group-hover:flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditClick(meal)}><Pencil className="h-3 w-3"/></Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"><Trash2 className="h-3 w-3"/></Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will remove "{food.name}" from your plan.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => onRemoveMeal(meal.id)}>Remove</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                       </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                        <CardFooter className="p-2">
                            <Button variant="ghost" size="sm" className="w-full" onClick={() => handleAddClick(day, mealType)}>
                                <Plus className="h-4 w-4 mr-1" /> Add
                            </Button>
                        </CardFooter>
                    </Card>
                );
            })}
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
     <AddFoodModal
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAddFood={handleAddFood}
        mealType={target?.mealType as any}
      />
       <EditFoodModal
        isOpen={!!editingMeal}
        onClose={() => setEditingMeal(null)}
        onUpdate={(id, qty) => {
            onUpdateMeal(id, qty);
            setEditingMeal(null);
        }}
        loggedFood={{logId: editingMeal?.id || "", foodId: editingMeal?.foodId || "", mealType: editingMeal?.mealType as any, quantity: editingMeal?.quantity || 0}}
      />
    </>
  );
}
