'use client';

import { useState } from 'react';
import Image from 'next/image';
import { mockFoods, type Food } from '@/lib/data';
import type { PlannedMeal } from '@/lib/planner-data';
import { Button } from '@/components/ui/button';
import { AddFoodModal } from '@/components/tracker/add-food-modal';
import { EditFoodModal } from '@/components/tracker/edit-food-modal';
import { EmptyState } from '../shared/empty-state';
import { Plus, Trash2, Pencil, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
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

const getMealIcon = (mealType: string) => {
  switch(mealType) {
    case 'Breakfast': return '🍳';
    case 'Lunch': return '🥗';
    case 'Dinner': return '🍽️';
    case 'Snacks': return '🍪';
    default: return '🍽️';
  }
};

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
              <Button onClick={() => handleAddClick('Monday', 'Breakfast')} size="lg">
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
      {/* Mobile View - Stacked Cards */}
      <div className="block lg:hidden space-y-4">
        {daysOfWeek.map((day) => {
          const dayMeals = plannedMeals.filter(m => m.day === day);
          if (dayMeals.length === 0) return null;
          
          return (
            <Card key={day} className="overflow-hidden">
              <CardHeader className="bg-muted/30 py-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base font-semibold">{day}</CardTitle>
                  <span className="text-sm font-medium text-primary">
                    {Math.round(summary[day]?.calories || 0)} kcal
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-3 space-y-3">
                {mealTypes.map((mealType) => {
                  const mealsForCell = dayMeals.filter(m => m.mealType === mealType);
                  if (mealsForCell.length === 0) return null;
                  
                  return (
                    <div key={`${day}-${mealType}`} className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <span>{getMealIcon(mealType)}</span>
                        <span>{mealType}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {mealsForCell.length} {mealsForCell.length === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                      <div className="pl-6 space-y-2">
                        {mealsForCell.map(meal => {
                          const food = foodDetailsMap[meal.foodId];
                          if (!food) return null;
                          return (
                            <div key={meal.id} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/30">
                              <div className="relative h-8 w-8 rounded-md overflow-hidden flex-shrink-0">
                                <Image 
                                  src={food.image} 
                                  alt={food.name} 
                                  fill
                                  className="object-cover"
                                  data-ai-hint={food.imageHint}
                                />
                              </div>
                              <div className="flex-grow min-w-0">
                                <p className="font-medium truncate">{food.name}</p>
                                <p className="text-xs text-muted-foreground">{meal.quantity}g · {Math.round(food.calories * meal.quantity / 100)} kcal</p>
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditClick(meal)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Remove {food.name}?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will remove this item from your {mealType.toLowerCase()} on {day}.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => onRemoveMeal(meal.id)}>
                                        Remove
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
              <CardFooter className="p-3 pt-0 flex gap-2">
                {mealTypes.map((mealType) => (
                  <Button 
                    key={mealType}
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-xs"
                    onClick={() => handleAddClick(day, mealType)}
                  >
                    <Plus className="h-3 w-3 mr-1" /> {mealType}
                  </Button>
                ))}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Desktop View - Scrollable Grid */}
      <ScrollArea className="hidden lg:block w-full rounded-lg border">
        <div className="min-w-[1200px] p-4">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-3 mb-3">
            {daysOfWeek.map((day) => (
              <div key={day} className="text-center">
                <h3 className="font-semibold text-sm">{day.slice(0,3)}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(summary[day]?.calories || 0)} kcal
                </p>
              </div>
            ))}
          </div>

          {/* Meal Grid */}
          <div className="grid grid-cols-7 gap-3">
            {daysOfWeek.map((day) => (
              <div key={day} className="space-y-3">
                {mealTypes.map((mealType) => {
                  const mealsForCell = plannedMeals.filter(m => m.day === day && m.mealType === mealType);
                  
                  return (
                    <Card key={`${day}-${mealType}`} className="overflow-hidden">
                      <CardHeader className="p-2 bg-muted/20">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xs font-medium flex items-center gap-1">
                            <span>{getMealIcon(mealType)}</span>
                            <span>{mealType}</span>
                          </CardTitle>
                          {mealsForCell.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {mealsForCell.length}
                            </span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="p-2 min-h-[120px] max-h-[200px] overflow-y-auto scrollbar-thin">
                        <div className="space-y-1.5">
                          {mealsForCell.length > 0 ? (
                            mealsForCell.map(meal => {
                              const food = foodDetailsMap[meal.foodId];
                              if (!food) return null;
                              return (
                                <div key={meal.id} className="group relative text-xs p-1.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                                  <div className="flex items-center gap-1.5">
                                    <div className="relative h-6 w-6 rounded-sm overflow-hidden flex-shrink-0">
                                      <Image 
                                        src={food.image} 
                                        alt={food.name} 
                                        fill
                                        className="object-cover"
                                        data-ai-hint={food.imageHint}
                                      />
                                    </div>
                                    <div className="flex-grow min-w-0">
                                      <p className="font-medium truncate">{food.name}</p>
                                      <p className="text-[10px] text-muted-foreground">{meal.quantity}g</p>
                                    </div>
                                  </div>
                                  
                                  {/* Hover Actions */}
                                  <div className="absolute inset-0 bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditClick(meal)}>
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive">
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Remove {food.name}?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This will remove this item from your {mealType.toLowerCase()} on {day}.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => onRemoveMeal(meal.id)}>
                                            Remove
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="h-[60px] flex items-center justify-center border border-dashed rounded-md">
                              <p className="text-[10px] text-muted-foreground">No items</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="p-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full h-7 text-xs"
                          onClick={() => handleAddClick(day, mealType)}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Modals */}
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
        loggedFood={{
          logId: editingMeal?.id || "",
          foodId: editingMeal?.foodId || "",
          mealType: editingMeal?.mealType as any,
          quantity: editingMeal?.quantity || 0
        }}
      />
    </>
  );
}