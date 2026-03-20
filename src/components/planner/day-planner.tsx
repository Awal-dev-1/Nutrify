'use client';

import { useState } from 'react';
import type { PlannedMeal } from '@/types/planner';
import type { FoodItem } from '@/types/food';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { AddFoodModal } from '@/components/tracker/add-food-modal';
import { EditFoodModal } from '@/components/tracker/edit-food-modal';
import { EmptyState } from '../shared/empty-state';
import { ChevronLeft, ChevronRight, Plus, Trash2, Pencil, Calendar, Utensils, Beef, Wheat, Droplets, Flame, UtensilsCrossed } from 'lucide-react';
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
import { Progress } from '../ui/progress';
import { subDays, addDays, format, isToday } from 'date-fns';
import { Badge } from '../ui/badge';
import { useUser } from '@/firebase';

interface DayPlannerProps {
  plannedMeals: (PlannedMeal & { id: string })[];
  summary: Record<string, any>;
  onAddMeal: (food: FoodItem, quantity: number, mealType: string, day: string) => void;
  onUpdateMeal: (id: string, newQuantity: number) => void;
  onRemoveMeal: (id: string) => void;
}

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

export function DayPlanner({ plannedMeals, summary, onAddMeal, onUpdateMeal, onRemoveMeal }: DayPlannerProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<(PlannedMeal & { id: string }) | null>(null);
  const [mealToAdd, setMealToAdd] = useState<string | null>(null);
  const { userProfile } = useUser();
  const [[page, direction], setPage] = useState([0, 0]);

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
    setCurrentDate(prevDate => newDirection > 0 ? addDays(prevDate, 1) : subDays(prevDate, 1));
  };

  const goToToday = () => {
    const today = new Date();
    if (currentDate < today) {
      setPage([page + 1, 1]);
    } else if (currentDate > today) {
      setPage([page - 1, -1]);
    }
    setCurrentDate(today);
  }
  
  const currentDayKey = format(currentDate, 'EEEE');
  const userGoals = userProfile?.goals || { dailyCalorieGoal: 2200, proteinPercentageGoal: 30, carbsPercentageGoal: 40, fatPercentageGoal: 30 };
  const derivedGoals = {
    calories: userGoals.dailyCalorieGoal,
    protein: (userGoals.dailyCalorieGoal * (userGoals.proteinPercentageGoal / 100)) / 4,
    carbs: (userGoals.dailyCalorieGoal * (userGoals.carbsPercentageGoal / 100)) / 4,
    fat: (userGoals.dailyCalorieGoal * (userGoals.fatPercentageGoal / 100)) / 9,
  };


  const handleAddClick = (mealType: string) => {
    setMealToAdd(mealType);
    setAddModalOpen(true);
  };
  
  const handleEditClick = (meal: PlannedMeal & { id: string }) => {
    setEditingMeal(meal);
  };

  const handleAddFood = (food: FoodItem, quantity: number, mealType: string) => {
    if (mealToAdd) {
      onAddMeal(food, quantity, mealToAdd, currentDayKey);
    }
  };

  const dailyTotals = summary[currentDayKey] || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const mealsForDay = plannedMeals.filter((m) => m.day === currentDayKey);

  const calorieProgress = (dailyTotals.calories / derivedGoals.calories) * 100;
  const proteinProgress = (dailyTotals.protein / derivedGoals.protein) * 100;
  const carbsProgress = (dailyTotals.carbs / derivedGoals.carbs) * 100;
  const fatProgress = (dailyTotals.fat / derivedGoals.fat) * 100;

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
    }),
  };

  return (
    <div className="max-w-4xl mx-auto relative overflow-x-hidden min-h-[60vh]">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={page}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          className="w-full space-y-6 absolute"
        >
          {/* Daily Summary Card */}
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {format(currentDate, 'EEEE, MMM d')}
                  </CardTitle>
                  <Button variant="outline" onClick={goToToday} disabled={isToday(currentDate)}>
                      Today
                  </Button>
              </div>
              <CardDescription>How your planned meals stack up against your goals.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              {/* Calories */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-muted-foreground">Calories</span>
                  <span className="font-bold text-primary">{Math.round(dailyTotals.calories)} / {derivedGoals.calories} kcal</span>
                </div>
                <Progress value={calorieProgress} className="h-2" />
              </div>

              {/* Macros */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Beef className="h-3.5 w-3.5 text-red-500" />
                    <span className="font-medium text-muted-foreground">Protein</span>
                    <span className="font-semibold ml-auto">{Math.round(dailyTotals.protein)}g / {Math.round(derivedGoals.protein)}g</span>
                  </div>
                  <Progress value={proteinProgress} className="h-1.5" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Wheat className="h-3.5 w-3.5 text-yellow-600" />
                    <span className="font-medium text-muted-foreground">Carbs</span>
                    <span className="font-semibold ml-auto">{Math.round(dailyTotals.carbs)}g / {Math.round(derivedGoals.carbs)}g</span>
                  </div>
                  <Progress value={carbsProgress} className="h-1.5" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Droplets className="h-3.5 w-3.5 text-blue-500" />
                    <span className="font-medium text-muted-foreground">Fat</span>
                    <span className="font-semibold ml-auto">{Math.round(dailyTotals.fat)}g / {Math.round(derivedGoals.fat)}g</span>
                  </div>
                  <Progress value={fatProgress} className="h-1.5" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between p-4 border-t">
              <Button variant="outline" onClick={() => paginate(-1)}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              <Button variant="outline" onClick={() => paginate(1)}>
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
          
          {/* Meals Section */}
          {mealsForDay.length === 0 ? (
            <EmptyState 
              title="No meals planned for this day" 
              description="Start planning your day by adding meals."
            >
              <Button onClick={() => handleAddClick('Breakfast')} size="lg">
                <Plus className="mr-2 h-4 w-4" /> Add First Meal
              </Button>
            </EmptyState>
          ) : (
            <div className="space-y-4">
              <Accordion type="multiple" defaultValue={mealTypes} className="space-y-4">
                {mealTypes.map((mealType) => {
                  const mealsForType = mealsForDay.filter(m => m.mealType === mealType);
                  const totalCalories = mealsForType.reduce((acc, meal) => acc + meal.calories, 0);

                  return (
                    <Card key={mealType} className="overflow-hidden border shadow-lg">
                      <AccordionItem value={mealType} className="border-0">
                        <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50 transition-colors">
                          <div className="flex justify-between w-full items-center">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{getMealIcon(mealType)}</span>
                              <h3 className="font-semibold text-lg">{mealType}</h3>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="px-3 py-1 text-sm">{Math.round(totalCalories)} kcal</Badge>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6 pt-0">
                          <div className="space-y-3">
                            {mealsForType.length > 0 ? (
                              mealsForType.map(meal => (
                                  <div key={meal.id} className="group relative flex items-center gap-3 p-3 rounded-lg border bg-background hover:shadow-sm">
                                    <div className="flex-grow min-w-0">
                                      <p className="font-medium truncate">{meal.foodName}</p>
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span>{meal.quantity}g</span>
                                        <span className="text-muted-foreground/30">|</span>
                                        <span>{Math.round(meal.calories)} kcal</span>
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
                                            <AlertDialogTitle>Remove {meal.foodName}?</AlertDialogTitle>
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
                              )
                            ) : (
                              <div className="py-8 text-center border-2 border-dashed rounded-lg">
                                <UtensilsCrossed className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                                <p className="text-sm text-muted-foreground">No food planned</p>
                              </div>
                            )}
                            <Button 
                                variant="outline" 
                                className="w-full mt-2 border-dashed"
                                onClick={() => handleAddClick(mealType)}
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
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <AddFoodModal
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAddFood={handleAddFood}
        mealType={mealToAdd as any}
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
    </div>
  );
}
