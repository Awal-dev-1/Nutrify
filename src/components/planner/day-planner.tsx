
'use client';

import { useState } from 'react';
import type { PlannedMeal } from '@/types/planner';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { Plus, Trash2, Pencil, Calendar, Utensils, Beef, Wheat, Droplets, Flame, UtensilsCrossed, Cookie } from 'lucide-react';
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
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/firebase';

interface DayPlannerProps {
  plannedMeals: (Partial<PlannedMeal> & { id?: string })[];
  summary: Record<string, any>;
  onAddMealClick: (day: string, mealType: string) => void;
  onEditMealClick: (meal: PlannedMeal & { id: string }) => void;
  onRemoveMeal: (id: string) => void;
}

const mealTypes = ['Breakfast', 'Lunch', 'Dinner'];

const getMealIcon = (mealType: string) => {
  switch(mealType) {
    case 'Breakfast': return '🍳';
    case 'Lunch': return '🥗';
    case 'Dinner': return '🍽️';
    default: return '🍽️';
  }
};

export function DayPlanner({ plannedMeals, summary, onAddMealClick, onEditMealClick, onRemoveMeal }: DayPlannerProps) {
  const { userProfile } = useUser();

  const currentDate = new Date();
  const currentDayKey = format(currentDate, 'EEEE');
  const userGoals = userProfile?.goals || { dailyCalorieGoal: 2200, proteinPercentageGoal: 30, carbsPercentageGoal: 40, fatPercentageGoal: 30 };
  const derivedGoals = {
    calories: userGoals.dailyCalorieGoal,
    protein: (userGoals.dailyCalorieGoal * (userGoals.proteinPercentageGoal / 100)) / 4,
    carbs: (userGoals.dailyCalorieGoal * (userGoals.carbsPercentageGoal / 100)) / 4,
    fat: (userGoals.dailyCalorieGoal * (userGoals.fatPercentageGoal / 100)) / 9,
  };

  const dailyTotals = summary[currentDayKey] || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const mealsForDay = plannedMeals.filter((m) => m.day === currentDayKey);

  const calorieProgress = (dailyTotals.calories / derivedGoals.calories) * 100;
  const proteinProgress = (dailyTotals.protein / derivedGoals.protein) * 100;
  const carbsProgress = (dailyTotals.carbs / derivedGoals.carbs) * 100;
  const fatProgress = (dailyTotals.fat / derivedGoals.fat) * 100;

  return (
    <div className="max-w-4xl mx-auto min-h-[60vh]">
      <div className="w-full space-y-4 sm:space-y-6">

        {/* ── Daily Summary Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-2 shadow-lg">
            <CardHeader className="pb-3">
              {/* Title row */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base sm:text-lg font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  Today's Plan ({format(currentDate, 'MMM d')})
                </CardTitle>
                <Badge>Today</Badge>
              </div>
              <CardDescription className="text-xs sm:text-sm pt-1">
                Your planned meals and macros for today.
              </CardDescription>
            </CardHeader>

            <CardContent className="grid gap-5 sm:gap-6">
              {/* Calories */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-muted-foreground">Calories</span>
                  <span className="font-bold text-primary text-xs sm:text-sm">
                    {Math.round(dailyTotals.calories)} / {derivedGoals.calories} kcal
                  </span>
                </div>
                <Progress value={calorieProgress} className="h-2" />
              </div>

              {/* Macros: single column on mobile, 3-col on sm+ */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Beef className="h-3.5 w-3.5 text-red-500 shrink-0" />
                    <span className="font-medium text-muted-foreground">Protein</span>
                    <span className="font-semibold ml-auto text-xs sm:text-sm">
                      {Math.round(dailyTotals.protein)}g / {Math.round(derivedGoals.protein)}g
                    </span>
                  </div>
                  <Progress value={proteinProgress} className="h-1.5" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Wheat className="h-3.5 w-3.5 text-yellow-600 shrink-0" />
                    <span className="font-medium text-muted-foreground">Carbs</span>
                    <span className="font-semibold ml-auto text-xs sm:text-sm">
                      {Math.round(dailyTotals.carbs)}g / {Math.round(derivedGoals.carbs)}g
                    </span>
                  </div>
                  <Progress value={carbsProgress} className="h-1.5" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Droplets className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span className="font-medium text-muted-foreground">Fat</span>
                    <span className="font-semibold ml-auto text-xs sm:text-sm">
                      {Math.round(dailyTotals.fat)}g / {Math.round(derivedGoals.fat)}g
                    </span>
                  </div>
                  <Progress value={fatProgress} className="h-1.5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Meals Section ── */}
        <motion.div
          className="space-y-3 sm:space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Accordion type="multiple" defaultValue={mealTypes} className="space-y-3 sm:space-y-4">
            {mealTypes.map((mealType) => {
              const mealsForType = mealsForDay.filter(m => m.mealType === mealType);
              const totalCalories = mealsForType.reduce((acc, meal) => acc + meal.calories, 0);

              return (
                <Card key={mealType} className="overflow-hidden border shadow-lg">
                  <AccordionItem value={mealType} className="border-0">
                    <AccordionTrigger className="px-4 sm:px-6 py-3 sm:py-4 hover:no-underline hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between w-full items-center gap-2">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <span className="text-lg sm:text-xl">{getMealIcon(mealType)}</span>
                          <h3 className="font-semibold text-base sm:text-lg truncate">{mealType}</h3>
                        </div>
                        <Badge variant="outline" className="px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm shrink-0">
                          {Math.round(totalCalories)} kcal
                        </Badge>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
                      <div className="space-y-3">
                        {mealsForType.map((meal, index) => (
                            <div
                              key={meal.id || index}
                              className="group relative flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border bg-background hover:shadow-sm"
                            >
                              <div className="flex-grow min-w-0">
                                <p className="font-medium text-sm sm:text-base">{meal.foodName}</p>
                                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                                  <span>{meal.quantity}g</span>
                                  <span className="text-muted-foreground/30">|</span>
                                  <span>{Math.round(meal.calories)} kcal</span>
                                </div>
                              </div>

                              <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => onEditMealClick(meal as PlannedMeal & { id: string })}
                                  disabled={!meal.id}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:text-destructive"
                                      disabled={!meal.id}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Remove {meal.foodName}?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently remove this item from your meal plan.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-0">
                                      <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="w-full sm:w-auto"
                                        onClick={() => onRemoveMeal(meal.id!)}
                                      >
                                        Remove
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          ))}
                        {mealsForType.length === 0 && (
                            <div className="py-6 sm:py-8 text-center border-2 border-dashed rounded-lg">
                              <UtensilsCrossed className="h-7 w-7 sm:h-8 sm:w-8 mx-auto mb-2 text-muted-foreground/50" />
                              <p className="text-sm text-muted-foreground">No food planned</p>
                            </div>
                        )}

                        <Button
                          variant="outline"
                          className="w-full mt-2 border-dashed"
                          onClick={() => onAddMealClick(currentDayKey, mealType)}
                        >
                          <Plus className="h-4 w-4 mr-2" /> Add Food
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Card>
              );
            })}
          </Accordion>
           {mealsForDay.length === 0 && (
             <EmptyState
                title="No meals planned for today"
                description="Start planning your day by adding meals."
              >
                <Button onClick={() => onAddMealClick(currentDayKey, 'Breakfast')} size="lg">
                  <Plus className="mr-2 h-4 w-4" /> Add First Meal
                </Button>
              </EmptyState>
           )}
        </motion.div>
      </div>
    </div>
  );
}
