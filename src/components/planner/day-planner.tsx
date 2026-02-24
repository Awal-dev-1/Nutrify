
'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { mockFoods, type Food } from '@/lib/data';
import type { PlannedMeal } from '@/lib/planner-data';
import { Button } from '@/components/ui/button';
import { AddFoodModal } from '@/components/tracker/add-food-modal';
import { EditFoodModal } from '@/components/tracker/edit-food-modal';
import { EmptyState } from '../shared/empty-state';
import { ChevronLeft, ChevronRight, Plus, Trash2, Pencil, Calendar, Utensils, Apple, Beef, Wheat, Droplets, Flame } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '../ui/progress';
import { mockUserGoals } from '@/lib/planner-data';
import { subDays, addDays, format } from 'date-fns';

interface DayPlannerProps {
  plannedMeals: PlannedMeal[];
  summary: Record<string, any>;
  onAddMeal: (food: Food, quantity: number, mealType: string, day: string) => void;
  onUpdateMeal: (id: string, newQuantity: number) => void;
  onRemoveMeal: (id: string) => void;
}

export function DayPlanner({ plannedMeals, summary, onAddMeal, onUpdateMeal, onRemoveMeal }: DayPlannerProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<PlannedMeal | null>(null);
  const [mealToAdd, setMealToAdd] = useState<string | null>(null);
  
  const currentDayKey = format(currentDate, 'EEEE');

  const foodDetailsMap = mockFoods.reduce((acc, food) => {
    acc[food.id] = food;
    return acc;
  }, {} as Record<string, Food>);

  const handleAddClick = (mealType: string) => {
    setMealToAdd(mealType);
    setAddModalOpen(true);
  };
  
  const handleEditClick = (meal: PlannedMeal) => {
    setEditingMeal(meal);
  };

  const handleAddFood = (food: Food, quantity: number, mealType: string) => {
    if (mealToAdd) {
      onAddMeal(food, quantity, mealToAdd, currentDayKey);
    }
  };

  const dailyTotals = summary[currentDayKey] || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const mealsForDay = plannedMeals.filter((m) => m.day === currentDayKey);
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

  const calorieProgress = (dailyTotals.calories / mockUserGoals.calories) * 100;
  const proteinProgress = (dailyTotals.protein / mockUserGoals.protein) * 100;
  const carbsProgress = (dailyTotals.carbs / mockUserGoals.carbs) * 100;
  const fatProgress = (dailyTotals.fat / mockUserGoals.fat) * 100;

  return (
    <div className="space-y-6">
      {/* Date Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">
            {format(currentDate, 'EEEE, MMM d')}
          </h2>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(d => subDays(d, 1))} className="h-9 w-9">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setCurrentDate(new Date())} className="flex-1 sm:flex-none">
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(d => addDays(d, 1))} className="h-9 w-9">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Daily Summary Card */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            Daily Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          {/* Calories */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Calories</span>
              <span className="font-medium">{Math.round(dailyTotals.calories)} / {mockUserGoals.calories} kcal</span>
            </div>
            <Progress value={calorieProgress} className="h-2" />
          </div>

          {/* Macros */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-sm">
                <Beef className="h-3.5 w-3.5 text-red-500" />
                <span className="text-muted-foreground">Protein</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-medium">{Math.round(dailyTotals.protein)}g</span>
                <span className="text-xs text-muted-foreground">/ {mockUserGoals.protein}g</span>
              </div>
              <Progress value={proteinProgress} className="h-1.5" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-sm">
                <Wheat className="h-3.5 w-3.5 text-yellow-600" />
                <span className="text-muted-foreground">Carbs</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-medium">{Math.round(dailyTotals.carbs)}g</span>
                <span className="text-xs text-muted-foreground">/ {mockUserGoals.carbs}g</span>
              </div>
              <Progress value={carbsProgress} className="h-1.5" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-sm">
                <Droplets className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-muted-foreground">Fat</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-medium">{Math.round(dailyTotals.fat)}g</span>
                <span className="text-xs text-muted-foreground">/ {mockUserGoals.fat}g</span>
              </div>
              <Progress value={fatProgress} className="h-1.5" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Meals Section */}
      {mealsForDay.length === 0 ? (
        <EmptyState 
          title="No meals planned" 
          description="Start planning your day by adding meals."
        >
          <Button onClick={() => handleAddClick('Breakfast')} size="lg">
            <Plus className="mr-2 h-4 w-4" /> Add First Meal
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Today's Meals
            </h3>
            <span className="text-sm text-muted-foreground">
              {mealsForDay.length} items
            </span>
          </div>
          
          <Accordion type="multiple" defaultValue={mealTypes} className="space-y-3">
            {mealTypes.map((mealType) => {
              const mealsForType = mealsForDay.filter(m => m.mealType === mealType);
              const totalCalories = mealsForType.reduce((acc, meal) => {
                const food = foodDetailsMap[meal.foodId];
                return acc + (food ? (food.calories * meal.quantity / 100) : 0);
              }, 0);

              return (
                <Card key={mealType} className="overflow-hidden">
                  <AccordionItem value={mealType} className="border-0">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between w-full items-center">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{getMealIcon(mealType)}</span>
                          <h3 className="font-semibold">{mealType}</h3>
                          {mealsForType.length > 0 && (
                            <Badge variant="secondary" className="ml-2">
                              {mealsForType.length}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {totalCalories > 0 && (
                            <span className="text-sm font-medium">
                              {Math.round(totalCalories)} kcal
                            </span>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-0">
                      <div className="divide-y">
                        {mealsForType.length > 0 ? (
                          mealsForType.map(meal => {
                            const food = foodDetailsMap[meal.foodId];
                            if (!food) return null;
                            return (
                              <div key={meal.id} className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors group">
                                <div className="relative h-12 w-12 rounded-md overflow-hidden flex-shrink-0">
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
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>{meal.quantity}g</span>
                                    <span>•</span>
                                    <span>{Math.round(food.calories * meal.quantity / 100)} kcal</span>
                                  </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(meal)}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Remove {food.name}?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will remove this item from your {mealType.toLowerCase()} meal.
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
                            )
                          })
                        ) : (
                          <div className="p-8 text-center">
                            <Utensils className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
                            <p className="text-sm text-muted-foreground mb-3">
                              No food planned for {mealType}
                            </p>
                          </div>
                        )}
                        
                        {/* Add Food Button */}
                        <div className="p-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="w-full justify-start text-muted-foreground hover:text-foreground"
                            onClick={() => handleAddClick(mealType)}
                          >
                            <Plus className="h-4 w-4 mr-2" /> Add Food to {mealType}
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Card>
              );
            })}
          </Accordion>
        </div>
      )}

      <AddFoodModal
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAddFood={handleAddFood as any}
        mealType={mealToAdd as any}
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
    </div>
  );
}

// Helper component for badges (add this if you don't have it imported)
const Badge = ({ children, variant, className }: any) => {
  const variantClasses = {
    secondary: "bg-secondary text-secondary-foreground"
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};
