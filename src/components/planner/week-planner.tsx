
'use client';

import { useState } from 'react';
import type { PlannedMeal } from '@/types/planner';
import type { FoodItem } from '@/types/food';

import { Button } from '@/components/ui/button';
import { AddFoodModal } from '@/components/tracker/add-food-modal';
import { EditFoodModal } from '@/components/tracker/edit-food-modal';
import { EmptyState } from '../shared/empty-state';
import { Plus, Trash2, Pencil, UtensilsCrossed, Sparkles } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
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
    plannedMeals: (PlannedMeal & { id: string })[];
    summary: Record<string, {calories: number}>;
    onAddMeal: (food: FoodItem, quantity: number, mealType: string, day: string) => void;
    onUpdateMeal: (id: string, newQuantity: number) => void;
    onRemoveMeal: (id: string) => void;
}

export function WeekPlanner({ plannedMeals, summary, onAddMeal, onUpdateMeal, onRemoveMeal }: WeekPlannerProps) {
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<(PlannedMeal & { id: string }) | null>(null);
  const [target, setTarget] = useState<{ day: string; mealType: string } | null>(null);

  const handleAddClick = (day: string, mealType: string) => {
    setTarget({ day, mealType });
    setAddModalOpen(true);
  };
  
  const handleEditClick = (meal: PlannedMeal & { id: string }) => {
    setEditingMeal(meal);
  };

  const handleAddFood = (food: FoodItem, quantity: number, mealType: string) => {
    if (target) {
      onAddMeal(food, quantity, target.mealType, target.day);
    }
  };
  
  if (plannedMeals.length === 0) {
      return (
          <EmptyState 
            icon={<Sparkles className="h-16 w-16 text-muted-foreground" />}
            title="Your meal plan is empty" 
            description="Generate a new plan with AI or add your first meal to get started."
          >
              <Button onClick={() => handleAddClick('Monday', 'Breakfast')} size="lg">
                  <Plus className="mr-2 h-4 w-4" /> Add a Meal
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
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {daysOfWeek.map((day) => {
            const dayMeals = plannedMeals.filter(m => m.day === day);
            return (
              <div key={day} className="w-[300px] flex-shrink-0">
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-lg">{day}</CardTitle>
                    <CardDescription>{Math.round(summary[day]?.calories || 0)} kcal planned</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow p-4 pt-0">
                    {dayMeals.length > 0 ? (
                      <Accordion type="multiple" defaultValue={mealTypes} className="space-y-2">
                        {mealTypes.map(mealType => {
                          const mealsForType = dayMeals.filter(m => m.mealType === mealType);
                          if (mealsForType.length === 0) return null;
                          
                          return (
                            <AccordionItem key={mealType} value={mealType} className="border-none">
                              <Card className="bg-muted/30">
                                <AccordionTrigger className="p-3 text-sm font-semibold hover:no-underline">
                                  <div className="flex items-center gap-2">
                                    <span>{getMealIcon(mealType)}</span>
                                    {mealType}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-3 pb-3">
                                  <div className="space-y-2">
                                    {mealsForType.map(meal => (
                                      <div key={meal.id} className="group relative text-xs p-2 rounded-md bg-background hover:shadow-sm">
                                        <p className="font-medium truncate">{meal.foodName}</p>
                                        <p className="text-muted-foreground">{meal.quantity}g · {Math.round(meal.calories)} kcal</p>
                                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditClick(meal)}><Pencil className="h-3 w-3" /></Button>
                                          <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive"><Trash2 className="h-3 w-3" /></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                              <AlertDialogHeader>
                                                <AlertDialogTitle>Remove {meal.foodName}?</AlertDialogTitle>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => onRemoveMeal(meal.id)}>Remove</AlertDialogAction>
                                              </AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </AccordionContent>
                              </Card>
                            </AccordionItem>
                          )
                        })}
                      </Accordion>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4 border-2 border-dashed rounded-lg">
                        <UtensilsCrossed className="h-8 w-8 text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground">No meals planned</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="p-2">
                    <Button variant="ghost" className="w-full" onClick={() => handleAddClick(day, 'Breakfast')}>
                      <Plus className="h-4 w-4 mr-2" /> Add Meal
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            );
          })}
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
        loggedFood={editingMeal ? { logId: editingMeal.id, quantity: editingMeal.quantity } : null}
      />
    </>
  );
}
