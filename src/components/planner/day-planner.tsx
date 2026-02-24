'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { mockFoods, type Food } from '@/lib/data';
import type { PlannedMeal } from '@/lib/planner-data';
import { Button } from '@/components/ui/button';
import { AddFoodModal } from '@/components/tracker/add-food-modal';
import { EditFoodModal } from '@/components/tracker/edit-food-modal';
import { EmptyState } from '../shared/empty-state';
import { ChevronLeft, ChevronRight, Plus, Trash2, Pencil } from 'lucide-react';
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
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">
          {format(currentDate, 'EEEE, MMM d')}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(d => subDays(d, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setCurrentDate(new Date())}>Today</Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(d => addDays(d, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryItem label="Planned Calories" value={`${Math.round(dailyTotals.calories)} / ${mockUserGoals.calories} kcal`} progress={(dailyTotals.calories / mockUserGoals.calories) * 100} />
            <SummaryItem label="Protein" value={`${Math.round(dailyTotals.protein)}g / ${mockUserGoals.protein}g`} progress={(dailyTotals.protein / mockUserGoals.protein) * 100} />
            <SummaryItem label="Carbs" value={`${Math.round(dailyTotals.carbs)}g / ${mockUserGoals.carbs}g`} progress={(dailyTotals.carbs / mockUserGoals.carbs) * 100} />
            <SummaryItem label="Fat" value={`${Math.round(dailyTotals.fat)}g / ${mockUserGoals.fat}g`} progress={(dailyTotals.fat / mockUserGoals.fat) * 100} />
        </CardContent>
      </Card>
      
      {mealsForDay.length === 0 ? (
          <EmptyState title="No meals planned for this day" description="Add meals to start planning your day.">
                <Button onClick={() => handleAddClick('Breakfast')}>
                  <Plus className="mr-2 h-4 w-4" /> Start Planning
              </Button>
          </EmptyState>
      ): (
        <Accordion type="multiple" defaultValue={mealTypes} className="w-full space-y-4">
        {mealTypes.map((mealType) => {
          const mealsForType = mealsForDay.filter(m => m.mealType === mealType);
          const totalCalories = mealsForType.reduce((acc, meal) => {
              const food = foodDetailsMap[meal.foodId];
              return acc + (food ? (food.calories * meal.quantity / 100) : 0);
          }, 0);

          return (
            <Card key={mealType}>
              <AccordionItem value={mealType} className="border-b-0">
                <AccordionTrigger className="p-4 hover:no-underline">
                  <div className="flex justify-between w-full items-center">
                    <h3 className="text-lg font-semibold">{mealType}</h3>
                    <span className="text-muted-foreground">{Math.round(totalCalories)} kcal</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0">
                  <div className="space-y-3">
                    {mealsForType.length > 0 ? (
                      mealsForType.map(meal => {
                          const food = foodDetailsMap[meal.foodId];
                          if (!food) return null;
                          return (
                              <div key={meal.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50 group">
                                <Image src={food.image} alt={food.name} width={48} height={48} className="rounded-md object-cover" data-ai-hint={food.imageHint} />
                                <div className="flex-grow">
                                  <p className="font-semibold">{food.name}</p>
                                  <p className="text-sm text-muted-foreground">{meal.quantity}g · {Math.round(food.calories * meal.quantity / 100)} kcal</p>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(meal)}><Pencil className="h-4 w-4"/></Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>This will remove "{food.name}" from your plan.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => onRemoveMeal(meal.id)}>Remove</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                              </div>
                          )
                      })
                    ) : (
                      <p className="text-sm text-center text-muted-foreground py-4">No food planned for {mealType}.</p>
                    )}
                     <div className="flex justify-end pt-2">
                        <Button size="sm" variant="ghost" onClick={() => handleAddClick(mealType)}>
                            <Plus className="h-4 w-4 mr-2"/> Add Food
                        </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Card>
          );
        })}
      </Accordion>
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
        loggedFood={{logId: editingMeal?.id || "", foodId: editingMeal?.foodId || "", mealType: editingMeal?.mealType as any, quantity: editingMeal?.quantity || 0}}
      />
    </div>
  );
}


const SummaryItem: FC<{label: string; value: string; progress?: number}> = ({label, value, progress}) => (
    <div>
        <div className="flex justify-between items-center mb-1">
            <p className="text-sm font-medium">{label}</p>
        </div>
        {progress !== undefined && <Progress value={progress} className="h-2 mb-2" />}
        <p className="text-sm text-muted-foreground">{value}</p>
    </div>
);
