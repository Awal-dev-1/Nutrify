'use client';

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { searchFoods } from '@/ai/flows/search-foods-flow';
import type { FoodItem } from '@/types/food';
import type { PlannedMeal } from '@/types/planner';
import {
  addPlannedMeal,
  updatePlannedMeal,
  deletePlannedMeal,
  clearPlan,
} from '@/services/plannerService';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DayPlanner } from '@/components/planner/day-planner';
import { WeekPlanner } from '@/components/planner/week-planner';
import { PlannerControls } from '@/components/planner/planner-controls';
import { Loader2 } from 'lucide-react';

export default function MealPlannerPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch planned meals from Firestore
  const plannedMealsQuery = useMemoFirebase(
    () =>
      user
        ? query(collection(db, 'users', user.uid, 'plannedMeals'), orderBy('createdAt', 'asc'))
        : null,
    [user, db]
  );
  const { data: plannedMeals, isLoading } = useCollection<PlannedMeal>(
    plannedMealsQuery
  );

  const summary = useMemo(() => {
    if (!plannedMeals) return {};

    return plannedMeals.reduce((acc, meal) => {
      if (!acc[meal.day]) {
        acc[meal.day] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }
      acc[meal.day].calories += meal.calories;
      acc[meal.day].protein += meal.protein;
      acc[meal.day].carbs += meal.carbs;
      acc[meal.day].fat += meal.fat;
      return acc;
    }, {} as Record<string, { calories: number; protein: number; carbs: number; fat: number }>);
  }, [plannedMeals]);

  const handleAddMeal = async (
    food: FoodItem,
    quantity: number,
    mealType: string,
    day: string
  ) => {
    if (!user || !db) return;
    try {
      await addPlannedMeal(db, user.uid, day, mealType, food, quantity);
      toast({
        title: 'Meal Added',
        description: `${food.foodName} has been added to your ${day} plan.`,
      });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not add meal.' });
    }
  };

  const handleUpdateMeal = async (id: string, newQuantity: number) => {
    if (!user || !db || !plannedMeals) return;

    const originalMeal = plannedMeals.find((meal) => meal.id === id);
    if (!originalMeal || originalMeal.quantity === 0) return;

    const ratio = newQuantity / originalMeal.quantity;
    const updates = {
      quantity: newQuantity,
      calories: originalMeal.calories * ratio,
      protein: originalMeal.protein * ratio,
      carbs: originalMeal.carbs * ratio,
      fat: originalMeal.fat * ratio,
    };

    try {
      await updatePlannedMeal(db, user.uid, id, updates);
      toast({
        title: 'Meal Updated',
        description: `The portion size has been updated.`,
      });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update meal.' });
    }
  };

  const handleRemoveMeal = async (id: string) => {
    if (!user || !db) return;
    try {
      await deletePlannedMeal(db, user.uid, id);
      toast({
        variant: 'destructive',
        title: 'Meal Removed',
        description: `The meal has been removed from your plan.`,
      });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not remove meal.' });
    }
  };

  const handleGeneratePlan = async () => {
    if (!user || !db) return;

    setIsGenerating(true);
    await clearPlan(db, user.uid);

    try {
      const foodQueries = ['jollof rice', 'oatmeal porridge', 'grilled tilapia salad'];
      const foodResults = await Promise.all(foodQueries.map((q) => searchFoods({ query: q })));
      const foods = foodResults.map((r) => r.foodItems[0]).filter(Boolean);

      if (foods.length < 3) throw new Error('Could not get enough food items from AI.');

      const [lunchFood, breakfastFood, dinnerFood] = foods;
      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const mealPlanPromises: Promise<void>[] = [];

      daysOfWeek.forEach((day) => {
        mealPlanPromises.push(addPlannedMeal(db, user.uid, day, 'Breakfast', breakfastFood, 150));
        mealPlanPromises.push(addPlannedMeal(db, user.uid, day, 'Lunch', lunchFood, 300));
        mealPlanPromises.push(addPlannedMeal(db, user.uid, day, 'Dinner', dinnerFood, 250));
      });

      await Promise.all(mealPlanPromises);

      toast({
        title: 'Plan Generated!',
        description: 'A suggested meal plan has been created for you.',
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Failed to generate plan',
        description: 'The AI could not generate a meal plan. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearPlan = async () => {
    if (!user || !db) return;
    try {
      await clearPlan(db, user.uid);
      toast({
        variant: 'destructive',
        title: 'Plan Cleared',
        description: `Your meal plan has been reset.`,
      });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not clear plan.' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meal Planner</h1>
          <p className="text-muted-foreground">
            Plan your meals ahead to stay consistent with your goals.
          </p>
        </div>
        <PlannerControls
          onGenerate={handleGeneratePlan}
          onClear={handleClearPlan}
          isGenerating={isGenerating}
        />
      </div>

      <Tabs defaultValue="week" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="week">Week Planner</TabsTrigger>
          <TabsTrigger value="day">Day Planner</TabsTrigger>
        </TabsList>

        <TabsContent value="week" className="mt-6">
          <WeekPlanner
            plannedMeals={plannedMeals || []}
            summary={summary}
            onAddMeal={handleAddMeal}
            onUpdateMeal={handleUpdateMeal}
            onRemoveMeal={handleRemoveMeal}
          />
        </TabsContent>

        <TabsContent value="day" className="mt-6">
          <DayPlanner
            plannedMeals={plannedMeals || []}
            summary={summary}
            onAddMeal={handleAddMeal}
            onUpdateMeal={handleUpdateMeal}
            onRemoveMeal={handleRemoveMeal}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

    