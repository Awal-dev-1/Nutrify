
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { PlannedMeal } from '@/types/planner';
import { addPlannedMeal, updatePlannedMeal, deletePlannedMeal, clearPlan, addGeneratedMealToPlan } from '@/services/plannerService';
import {
  generatePersonalizedMealPlan,
  type GeneratePersonalizedMealPlanInput,
} from '@/ai/flows/generate-personalized-meal-plan';
import { useToast } from '@/hooks/use-toast';
import { PlannerControls } from '@/components/planner/planner-controls';
import { WeekPlanner } from '@/components/planner/week-planner';
import { DayPlanner } from '@/components/planner/day-planner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Calendar } from 'lucide-react';
import type { FoodItem } from '@/types/food';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

export default function MealPlannerPage() {
  const { toast } = useToast();
  const { user, userProfile, isProfileLoading } = useUser();
  const db = useFirestore();

  const [activeTab, setActiveTab] = useState('day');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const plannedMealsQuery = useMemoFirebase(
    () => user ? query(collection(db, 'users', user.uid, 'plannedMeals'), orderBy('createdAt', 'asc')) : null,
    [user, db]
  );
  const { data: plannedMeals, isLoading: isPlannerLoading } = useCollection<PlannedMeal & { id: string }>(plannedMealsQuery);

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
    }, {} as Record<string, any>);
  }, [plannedMeals]);
  
  const handleGeneratePlan = async () => {
    if (!user || !db || !userProfile) return;

    if (!userProfile.profile || !userProfile.goals || !userProfile.health) {
        setGenerationError("Please complete your profile and goals before generating a plan.");
        return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
        const input: GeneratePersonalizedMealPlanInput = {
            gender: userProfile.profile.gender as any,
            age: userProfile.profile.age,
            heightCm: userProfile.profile.heightCm,
            weightKg: userProfile.profile.weightKg,
            activityLevel: userProfile.profile.activityLevel as any,
            goal: userProfile.health.primaryGoal as any,
            targetCalories: userProfile.goals.dailyCalorieGoal,
            proteinPercentageGoal: userProfile.goals.proteinPercentageGoal,
            carbsPercentageGoal: userProfile.goals.carbsPercentageGoal,
            fatPercentageGoal: userProfile.goals.fatPercentageGoal,
            dietaryPreferences: userProfile.health.dietaryPreferences || [],
            // These would ideally come from analytics
            averageDailyCalories: 2000, 
            averageDailyProtein: 100,
            averageDailyCarbs: 250,
            averageDailyFat: 60,
            averageDailyIron: 15,
            averageDailyVitaminA: 700,
        };

        await clearPlan(db, user.uid);
        const result = await generatePersonalizedMealPlan(input);

        // Add generated meals to the plan
        for (const meal of result.plannedMeals) {
            await addGeneratedMealToPlan(db, user.uid, meal.day, meal.mealType, {
                foodName: meal.foodName,
                quantityGrams: meal.quantityGrams,
                calories: meal.calories,
                proteinGrams: meal.proteinGrams,
                carbsGrams: meal.carbsGrams,
                fatGrams: meal.fatGrams,
            });
        }

        toast({
            title: "Meal Plan Generated!",
            description: result.planSummary,
        });

    } catch (err: any) {
        setGenerationError(err.message || "An unknown error occurred while generating the plan.");
    } finally {
        setIsGenerating(false);
    }
  };
  
  const handleClearPlan = async () => {
    if (!user || !db) return;
    await clearPlan(db, user.uid);
    toast({
        variant: "destructive",
        title: "Plan Cleared",
        description: "Your meal plan has been reset.",
    });
  };

  const handleAddMeal = (food: FoodItem, quantity: number, mealType: string, day: string) => {
    if (!user || !db) return;
    addPlannedMeal(db, user.uid, day, mealType, food, quantity);
  };
  
  const handleUpdateMeal = (id: string, newQuantity: number) => {
     if (!user || !db || !plannedMeals) return;
     const meal = plannedMeals.find(m => m.id === id);
     if(!meal) return;
     
     const ratio = newQuantity / meal.quantity;
     updatePlannedMeal(db, user.uid, id, {
         quantity: newQuantity,
         calories: meal.calories * ratio,
         protein: meal.protein * ratio,
         carbs: meal.carbs * ratio,
         fat: meal.fat * ratio,
     });
  };

  const handleRemoveMeal = (id: string) => {
     if (!user || !db) return;
     deletePlannedMeal(db, user.uid, id);
  };
  
  const isLoading = isPlannerLoading || isProfileLoading;

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            AI Meal Planner
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl">
            Generate, view, and manage your weekly meal plan.
          </p>
        </div>
        <PlannerControls onGenerate={handleGeneratePlan} onClear={handleClearPlan} isGenerating={isGenerating} />
      </div>

      {generationError && (
          <Alert variant="destructive">
            <AlertTitle>Generation Failed</AlertTitle>
            <AlertDescription>{generationError}</AlertDescription>
          </Alert>
      )}
      
      {isLoading ? (
        <PlannerSkeleton />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="day">Day View</TabsTrigger>
            <TabsTrigger value="week">Week View</TabsTrigger>
          </TabsList>
          <TabsContent value="day" className="mt-6">
            <DayPlanner 
                plannedMeals={plannedMeals || []} 
                summary={mealSummary}
                onAddMeal={handleAddMeal}
                onUpdateMeal={handleUpdateMeal}
                onRemoveMeal={handleRemoveMeal}
            />
          </TabsContent>
          <TabsContent value="week" className="mt-6">
            <WeekPlanner 
                plannedMeals={plannedMeals || []} 
                summary={mealSummary}
                onAddMeal={handleAddMeal}
                onUpdateMeal={handleUpdateMeal}
                onRemoveMeal={handleRemoveMeal}
            />
          </TabsContent>
        </Tabs>
      )}
    </motion.div>
  );
}

const PlannerSkeleton = () => (
    <div className="space-y-8 animate-pulse">
      <div className="flex sm:items-center sm:justify-between gap-4 flex-col sm:flex-row">
        <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-64" />
        </div>
        <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-28" />
        </div>
      </div>
       <Skeleton className="h-12 w-full rounded-lg" />
       <Card className="border-2">
            <CardHeader className="pb-4">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-6">
                <Skeleton className="h-8 w-full" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
            </CardContent>
       </Card>
       <div className="space-y-4">
        {[1,2,3,4].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
       </div>
    </div>
)

    