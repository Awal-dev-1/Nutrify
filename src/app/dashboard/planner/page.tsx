'use client';

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { FoodItem } from '@/types/food';
import type { PlannedMeal } from '@/types/planner';
import {
  addPlannedMeal,
  updatePlannedMeal,
  deletePlannedMeal,
  clearPlan,
  addGeneratedMealToPlan,
} from '@/services/plannerService';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DayPlanner } from '@/components/planner/day-planner';
import { WeekPlanner } from '@/components/planner/week-planner';
import { PlannerControls } from '@/components/planner/planner-controls';
import { Loader2 } from 'lucide-react';
import { getAnalyticsData } from '@/services/analyticsService';
import { generatePersonalizedMealPlan } from '@/ai/flows/generate-personalized-meal-plan';

export default function MealPlannerPage() {
  const { user, userProfile } = useUser();
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

  const handleAddMeal = (
    food: FoodItem,
    quantity: number,
    mealType: string,
    day: string
  ) => {
    if (!user || !db) return;
    addPlannedMeal(db, user.uid, day, mealType, food, quantity);
    toast({
      title: 'Meal Added',
      description: `${food.foodName} has been added to your ${day} plan.`,
    });
  };

  const handleUpdateMeal = (id: string, newQuantity: number) => {
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

    updatePlannedMeal(db, user.uid, id, updates);
    toast({
      title: 'Meal Updated',
      description: `The portion size has been updated.`,
    });
  };

  const handleRemoveMeal = (id: string) => {
    if (!user || !db) return;
    deletePlannedMeal(db, user.uid, id);
    toast({
      variant: 'destructive',
      title: 'Meal Removed',
      description: `The meal has been removed from your plan.`,
    });
  };

  const handleGeneratePlan = async () => {
    if (!user || !db || !userProfile) {
      toast({
        variant: 'destructive',
        title: 'User Profile Not Loaded',
        description: 'Please wait for your profile to load and try again.',
      });
      return;
    }

    setIsGenerating(true);
    await clearPlan(db, user.uid); // This is good, clear the old plan first.

    try {
      // 1. Get analytics data for recent intake
      const analytics = await getAnalyticsData(db, user.uid, '7d');

      // 2. Prepare input for the meal plan flow
      const flowInput = {
        // Personal Details
        gender: (userProfile.profile?.gender.toLowerCase() || 'other') as 'male' | 'female' | 'other',
        age: userProfile.profile?.age || 30,
        heightCm: userProfile.profile?.heightCm || 170,
        weightKg: userProfile.profile?.weightKg || 70,
        activityLevel: (userProfile.profile?.activityLevel.replace('-', ' ') || 'moderate') as 'low' | 'moderate' | 'active' | 'very active',
        
        // Dietary Goals
        goal: (userProfile.health?.primaryGoal.replace('-', ' ') || 'maintain weight') as 'lose weight' | 'maintain weight' | 'gain weight' | 'eat healthier',
        targetCalories: userProfile.goals?.dailyCalorieGoal,
        proteinPercentageGoal: userProfile.goals?.proteinPercentageGoal || 30,
        carbsPercentageGoal: userProfile.goals?.carbsPercentageGoal || 40,
        fatPercentageGoal: userProfile.goals?.fatPercentageGoal || 30,
        ironTargetMg: userProfile.goals?.ironTargetMg,
        vitaminATargetMcg: userProfile.goals?.vitaminATargetMcg,

        // Preferences
        dietaryPreferences: userProfile.health?.dietaryPreferences || [],

        // Recent Intake
        averageDailyCalories: analytics.summary.averageCalories,
        averageDailyProtein: analytics.summary.averageProtein,
        averageDailyCarbs: analytics.summary.averageCarbs,
        averageDailyFat: analytics.summary.averageFat,
        averageDailyIron: analytics.summary.averageIron,
        averageDailyVitaminA: analytics.summary.averageVitaminA,
      };

      // 3. Call the AI flow
      const result = await generatePersonalizedMealPlan(flowInput);

      // 4. Add the generated plan to Firestore
      result.plannedMeals.forEach(mealItem => {
        addGeneratedMealToPlan(db, user.uid, mealItem.day, mealItem.mealType, mealItem);
      });
      
      toast({
        title: 'Plan Generated!',
        description: 'A new weekly meal plan has been created for you.',
      });

    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Failed to generate plan',
        description: error.message || 'The AI could not generate a meal plan. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearPlan = () => {
    if (!user || !db) return;
    clearPlan(db, user.uid);
    toast({
      variant: 'destructive',
      title: 'Plan Cleared',
      description: `Your meal plan has been reset.`,
    });
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
