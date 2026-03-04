'use client';

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { PlannedMeal as PlannedMealType } from '@/types/planner';
import {
  addPlannedMeal,
  updatePlannedMeal,
  deletePlannedMeal,
  clearPlan,
  addGeneratedMealToPlan,
} from '@/services/plannerService';
import {
  generatePersonalizedMealPlan,
  type GeneratePersonalizedMealPlanInput,
} from '@/ai/flows/generate-personalized-meal-plan';
import { useToast } from '@/hooks/use-toast';
import { PlannerControls } from '@/components/planner/planner-controls';
import { WeekPlanner } from '@/components/planner/week-planner';
import { DayPlanner } from '@/components/planner/day-planner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { FoodItem } from '@/types/food';

type PlannedMealWithId = PlannedMealType & { id: string };

export default function PlannerPage() {
  const { user, userProfile } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [view, setView] = useState('week');

  const plannedMealsQuery = useMemoFirebase(
    () => (user ? query(collection(db, 'users', user.uid, 'plannedMeals'), orderBy('createdAt', 'asc')) : null),
    [user, db]
  );
  const { data: plannedMeals, isLoading, error } = useCollection<PlannedMealWithId>(plannedMealsQuery);

  const handleGeneratePlan = async () => {
    if (!user || !db || !userProfile || !userProfile.profile || !userProfile.health || !userProfile.goals) {
      toast({
        variant: 'destructive',
        title: 'Cannot generate plan',
        description: 'Please complete your onboarding and set your goals first.',
      });
      return;
    }

    setIsGenerating(true);
    
    // Non-blocking clear of the plan
    clearPlan(db, user.uid);
    
    try {
      // These are hardcoded for now, but should come from analytics in a future version.
      const analytics = {
        averageDailyCalories: 2100,
        averageDailyProtein: 100,
        averageDailyCarbs: 250,
        averageDailyFat: 70,
        averageDailyIron: 15,
        averageDailyVitaminA: 800,
        recentDeficiencies: [],
        recentExcesses: [],
      };

      const input: GeneratePersonalizedMealPlanInput = {
        gender: ['male', 'female', 'other'].includes(userProfile.profile.gender) ? userProfile.profile.gender as 'male' | 'female' | 'other' : 'other',
        age: userProfile.profile.age,
        heightCm: userProfile.profile.heightCm,
        weightKg: userProfile.profile.weightKg,
        activityLevel: ['low', 'moderate', 'active', 'very-active'].includes(userProfile.profile.activityLevel) ? userProfile.profile.activityLevel.replace('-',' ') as 'low' | 'moderate' | 'active' | 'very active' : 'moderate',
        goal: ['lose-weight', 'maintain-weight', 'gain-weight', 'eat-healthier'].includes(userProfile.health.primaryGoal) ? userProfile.health.primaryGoal.replace('-', ' ') as 'lose weight' | 'maintain weight' | 'gain weight' | 'eat healthier' : 'maintain weight',
        targetCalories: userProfile.goals.dailyCalorieGoal,
        proteinPercentageGoal: userProfile.goals.proteinPercentageGoal,
        carbsPercentageGoal: userProfile.goals.carbsPercentageGoal,
        fatPercentageGoal: userProfile.goals.fatPercentageGoal,
        dietaryPreferences: userProfile.health.dietaryPreferences || [],
        ...analytics
      };
      
      const result = await generatePersonalizedMealPlan(input);
      
      result.plannedMeals.forEach(meal => {
        addGeneratedMealToPlan(db, user.uid, meal.day, meal.mealType, meal);
      });

      toast({
        title: '✨ Plan Generated!',
        description: result.planSummary,
      });

    } catch (err: any) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Failed to generate plan',
        description: err.message || 'An AI error occurred. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearPlan = () => {
    if (!user || !db) return;
    clearPlan(db, user.uid);
    toast({ title: 'Plan Cleared', description: 'Your meal plan has been reset.' });
  };

  const handleAddMeal = (food: FoodItem, quantity: number, mealType: string, day: string) => {
    if (!user || !db) return;
    addPlannedMeal(db, user.uid, day, mealType, food, quantity);
  };
  
  const handleUpdateMeal = (id: string, newQuantity: number) => {
    if(!user || !db || !plannedMeals) return;

    const mealToUpdate = plannedMeals.find(m => m.id === id);
    if (!mealToUpdate) return;
    
    const originalQuantity = mealToUpdate.quantity;
    if (originalQuantity <= 0) return;

    const ratio = newQuantity / originalQuantity;
    const updates = {
      quantity: newQuantity,
      calories: mealToUpdate.calories * ratio,
      protein: mealToUpdate.protein * ratio,
      carbs: mealToUpdate.carbs * ratio,
      fat: mealToUpdate.fat * ratio,
    }

    updatePlannedMeal(db, user.uid, id, updates);
  };

  const handleRemoveMeal = (id: string) => {
    if (!user || !db) return;
    deletePlannedMeal(db, user.uid, id);
  };
  
  const mealSummary = useMemo(() => {
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
    }, {} as Record<string, { calories: number; protein: number; carbs: number; fat: number; }>);
  }, [plannedMeals]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-[500px]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      );
    }
    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading plan</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      );
    }

    return (
      view === 'week' ? (
        <WeekPlanner
          plannedMeals={plannedMeals || []}
          summary={mealSummary}
          onAddMeal={handleAddMeal}
          onUpdateMeal={handleUpdateMeal}
          onRemoveMeal={handleRemoveMeal}
        />
      ) : (
         <DayPlanner
            plannedMeals={plannedMeals || []}
            summary={mealSummary}
            onAddMeal={handleAddMeal}
            onUpdateMeal={handleUpdateMeal}
            onRemoveMeal={handleRemoveMeal}
          />
      )
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">AI Meal Planner</h1>
          <p className="text-muted-foreground">
            Generate a personalized weekly meal plan or build your own.
          </p>
        </div>
        <PlannerControls
          onGenerate={handleGeneratePlan}
          onClear={handleClearPlan}
          isGenerating={isGenerating}
        />
      </div>

      <Tabs value={view} onValueChange={setView} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="week">Week View</TabsTrigger>
          <TabsTrigger value="day">Day View</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="min-h-[500px]">
        {renderContent()}
      </div>
    </div>
  );
}
