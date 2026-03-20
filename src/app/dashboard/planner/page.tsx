
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
import { Loader2, AlertCircle, Calendar } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { FoodItem } from '@/types/food';

type PlannedMealWithId = PlannedMealType & { id: string };

// Type-safe mapping from profile values to AI schema enums
const activityLevelMap: Record<string, 'low' | 'moderate' | 'active' | 'very active'> = {
  'low': 'low',
  'moderate': 'moderate',
  'active': 'active',
  'very-active': 'very active'
};
const goalMap: Record<string, 'lose weight' | 'maintain weight' | 'gain weight' | 'eat healthier'> = {
  'lose-weight': 'lose weight',
  'maintain-weight': 'maintain weight',
  'gain-weight': 'gain weight',
  'eat-healthier': 'eat healthier'
};

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
    
    await clearPlan(db, user.uid);
    
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

      const mappedActivityLevel = activityLevelMap[userProfile.profile.activityLevel] || 'moderate';
      const mappedGoal = goalMap[userProfile.health.primaryGoal] || 'maintain weight';
      const mappedGender = ['male', 'female', 'other'].includes(userProfile.profile.gender) ? userProfile.profile.gender as 'male' | 'female' | 'other' : 'other';

      const input: GeneratePersonalizedMealPlanInput = {
        gender: mappedGender,
        age: userProfile.profile.age,
        heightCm: userProfile.profile.heightCm,
        weightKg: userProfile.profile.weightKg,
        activityLevel: mappedActivityLevel,
        goal: mappedGoal,
        targetCalories: userProfile.goals.dailyCalorieGoal,
        proteinPercentageGoal: userProfile.goals.proteinPercentageGoal,
        carbsPercentageGoal: userProfile.goals.carbsPercentageGoal,
        fatPercentageGoal: userProfile.goals.fatPercentageGoal,
        dietaryPreferences: userProfile.health.dietaryPreferences || [],
        ...analytics
      };
      
      const result = await generatePersonalizedMealPlan(input);
      
      await Promise.all(result.plannedMeals.map(meal => {
        return addGeneratedMealToPlan(db, user.uid, meal.day, meal.mealType, meal);
      }));

      toast({
        title: '✨ Plan Generated!',
        description: result.planSummary,
        duration: 6000,
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

  const handleClearPlan = async () => {
    if (!user || !db) return;
    await clearPlan(db, user.uid);
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
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="h-7 w-7 text-primary" />
            AI Meal Planner
          </h1>
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
        <TabsContent value="week" className="mt-6">
            {isLoading ? (
                <div className="flex justify-center items-center h-[500px]"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
            ) : error ? (
                <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error loading plan</AlertTitle><AlertDescription>{error.message}</AlertDescription></Alert>
            ) : (
                <WeekPlanner
                    plannedMeals={plannedMeals || []}
                    summary={mealSummary}
                    onAddMeal={handleAddMeal}
                    onUpdateMeal={handleUpdateMeal}
                    onRemoveMeal={handleRemoveMeal}
                />
            )}
        </TabsContent>
        <TabsContent value="day" className="mt-6">
             {isLoading ? (
                <div className="flex justify-center items-center h-[500px]"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
            ) : error ? (
                <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error loading plan</AlertTitle><AlertDescription>{error.message}</AlertDescription></Alert>
            ) : (
                <DayPlanner
                    plannedMeals={plannedMeals || []}
                    summary={mealSummary}
                    onAddMeal={handleAddMeal}
                    onUpdateMeal={handleUpdateMeal}
                    onRemoveMeal={handleRemoveMeal}
                />
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
