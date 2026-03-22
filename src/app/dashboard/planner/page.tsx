
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { PlannedMeal } from '@/types/planner';
import { addPlannedMeal, updatePlannedMeal, deletePlannedMeal, clearPlan, addGeneratedMealToPlan } from '@/services/plannerService';
import {
  generatePersonalizedMealPlan,
  type GeneratePersonalizedMealPlanInput,
  type GeneratePersonalizedMealPlanOutput,
} from '@/ai/flows/generate-personalized-meal-plan';
import { useToast } from '@/hooks/use-toast';
import { PlannerControls } from '@/components/planner/planner-controls';
import { WeekPlanner } from '@/components/planner/week-planner';
import { DayPlanner } from '@/components/planner/day-planner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Calendar, Sparkles } from 'lucide-react';
import type { FoodItem } from '@/types/food';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { getAnalyticsData } from '@/services/analyticsService';
import { AddFoodModal } from '@/components/tracker/add-food-modal';
import { EditFoodModal } from '@/components/tracker/edit-food-modal';

type DisplayMeal = {
  id?: string; // Optional for preview meals
  foodName: string;
  day: string;
  mealType: string;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export default function MealPlannerPage() {
  const { toast } = useToast();
  const { user, userProfile, isProfileLoading } = useUser();
  const db = useFirestore();

  const [activeTab, setActiveTab] = useState('day');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [previewPlan, setPreviewPlan] = useState<GeneratePersonalizedMealPlanOutput | null>(null);

  // State for modals
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<(PlannedMeal & { id: string }) | null>(null);
  const [addMealContext, setAddMealContext] = useState<{ day: string, mealType: string } | null>(null);

  const plannedMealsQuery = useMemoFirebase(
    () => user ? query(collection(db, 'users', user.uid, 'plannedMeals'), orderBy('createdAt', 'asc')) : null,
    [user, db]
  );
  const { data: savedMeals, isLoading: isPlannerLoading } = useCollection<PlannedMeal & { id: string }>(plannedMealsQuery);

  const mealsToDisplay: DisplayMeal[] = useMemo(() => {
    if (previewPlan) {
      return previewPlan.plannedMeals.map(m => ({
        foodName: m.foodName,
        day: m.day,
        mealType: m.mealType,
        quantity: m.quantityGrams,
        calories: m.calories,
        protein: m.proteinGrams || 0,
        carbs: m.carbsGrams || 0,
        fat: m.fatGrams || 0,
      }));
    }
    return savedMeals || [];
  }, [previewPlan, savedMeals]);

  const mealSummary = useMemo(() => {
    if (!mealsToDisplay) return {};
    return mealsToDisplay.reduce((acc, meal) => {
      if (!acc[meal.day]) {
        acc[meal.day] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }
      acc[meal.day].calories += meal.calories;
      acc[meal.day].protein += meal.protein;
      acc[meal.day].carbs += meal.carbs;
      acc[meal.day].fat += meal.fat;
      return acc;
    }, {} as Record<string, any>);
  }, [mealsToDisplay]);
  
  const handleGeneratePlan = async () => {
    if (!user || !db || !userProfile) return;

    if (!userProfile.profile || !userProfile.goals || !userProfile.health) {
        setGenerationError("Please complete your profile and goals before generating a plan.");
        return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setPreviewPlan(null);

    try {
        const analytics = await getAnalyticsData(db, user.uid, '30d');
        const summary = analytics.summary;

        const activityLevel = userProfile.profile.activityLevel === 'very-active' 
            ? 'very active' 
            : userProfile.profile.activityLevel;
        
        const goalForAI = userProfile.health.primaryGoal.replace('-', ' ');

        const input: GeneratePersonalizedMealPlanInput = {
            gender: userProfile.profile.gender as any,
            age: userProfile.profile.age,
            heightCm: userProfile.profile.heightCm,
            weightKg: userProfile.profile.weightKg,
            activityLevel: activityLevel as any,
            goal: goalForAI as any,
            targetCalories: userProfile.goals.dailyCalorieGoal,
            proteinPercentageGoal: userProfile.goals.proteinPercentageGoal,
            carbsPercentageGoal: userProfile.goals.carbsPercentageGoal,
            fatPercentageGoal: userProfile.goals.fatPercentageGoal,
            ironTargetMg: userProfile.goals.ironTargetMg,
            vitaminATargetMcg: userProfile.goals.vitaminATargetMcg,
            dietaryPreferences: userProfile.health.dietaryPreferences || [],
            averageDailyCalories: summary.averageCalories > 0 ? Math.round(summary.averageCalories) : 2000,
            averageDailyProtein: summary.averageProtein > 0 ? Math.round(summary.averageProtein) : 100,
            averageDailyCarbs: summary.averageCarbs > 0 ? Math.round(summary.averageCarbs) : 250,
            averageDailyFat: summary.averageFat > 0 ? Math.round(summary.averageFat) : 60,
            averageDailyIron: summary.averageIron > 0 ? parseFloat(summary.averageIron.toFixed(1)) : 15,
            averageDailyVitaminA: summary.averageVitaminA > 0 ? Math.round(summary.averageVitaminA) : 700,
            recentDeficiencies: [],
            recentExcesses: [],
        };

        const result = await generatePersonalizedMealPlan(input);
        setPreviewPlan(result);
        toast({
            title: "Preview Generated!",
            description: "A new meal plan is ready for you to review and save.",
        });

    } catch (err: any) {
        setGenerationError(err.message || "An unknown error occurred while generating the plan.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSavePlan = async () => {
    if (!user || !db || !previewPlan) return;
    setIsSaving(true);
    try {
        await clearPlan(db, user.uid);
        for (const meal of previewPlan.plannedMeals) {
            await addGeneratedMealToPlan(db, user.uid, meal.day, meal.mealType, {
                foodName: meal.foodName,
                quantityGrams: meal.quantityGrams,
                calories: meal.calories,
                proteinGrams: meal.proteinGrams,
                carbsGrams: meal.carbsGrams,
                fatGrams: meal.fatGrams,
            });
        }
        setPreviewPlan(null);
        toast({
            title: "Plan Saved!",
            description: "Your new meal plan has been saved successfully.",
        });
    } catch(err: any) {
        setGenerationError(err.message || "An unknown error occurred while saving the plan.");
    } finally {
        setIsSaving(false);
    }
  }

  const handleDiscardPreview = () => {
    setPreviewPlan(null);
    toast({
        variant: "destructive",
        title: "Preview Discarded",
        description: "The generated plan has been discarded.",
    });
  }
  
  const handleClearPlan = async () => {
    if (!user || !db) return;
    await clearPlan(db, user.uid);
    setPreviewPlan(null);
    toast({
        variant: "destructive",
        title: "Plan Cleared",
        description: "Your meal plan has been reset.",
    });
  };

  const handleOpenAddModal = (day: string, mealType: string) => {
    setAddMealContext({ day, mealType });
    setAddModalOpen(true);
  };
  
  const handleAddMeal = (food: FoodItem, quantity: number, mealType: string) => {
    if (!user || !db || !addMealContext) return;
    addPlannedMeal(db, user.uid, addMealContext.day, mealType, food, quantity);
  };
  
  const handleUpdateMeal = (id: string, newQuantity: number) => {
     if (!user || !db || !savedMeals) return;
     const meal = savedMeals.find(m => m.id === id);
     if(!meal) return;
     
     const ratio = newQuantity / meal.quantity;
     updatePlannedMeal(db, user.uid, id, {
         quantity: newQuantity,
         calories: meal.calories * ratio,
         protein: meal.protein * ratio,
         carbs: meal.carbs * ratio,
         fat: meal.fat * ratio,
     });
     setEditingMeal(null);
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
      transition={{ duration: 0.2 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-h1 font-bold tracking-tight text-primary flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            AI Meal Planner
          </h1>
          <p className="text-body text-muted-foreground max-w-2xl">
            Generate, view, and manage your weekly meal plan.
          </p>
        </div>
        <PlannerControls 
          onGenerate={handleGeneratePlan} 
          onClear={handleClearPlan} 
          isGenerating={isGenerating}
          onSave={handleSavePlan}
          isSaving={isSaving}
          onDiscard={handleDiscardPreview}
          isPreviewing={!!previewPlan}
        />
      </div>

      {previewPlan && (
        <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertTitle>Plan Preview</AlertTitle>
            <AlertDescription>{previewPlan.planSummary || "You are currently viewing a generated plan. Save it to make it permanent, or discard it to keep your old plan."}</AlertDescription>
        </Alert>
      )}

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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <DayPlanner 
                  plannedMeals={mealsToDisplay} 
                  summary={mealSummary}
                  onAddMealClick={handleOpenAddModal}
                  onEditMealClick={setEditingMeal}
                  onRemoveMeal={handleRemoveMeal}
              />
            </motion.div>
          </TabsContent>
          <TabsContent value="week" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <WeekPlanner 
                  plannedMeals={mealsToDisplay}
                  summary={mealSummary}
                  onAddMealClick={handleOpenAddModal}
                  onEditMealClick={setEditingMeal}
                  onRemoveMeal={handleRemoveMeal}
              />
            </motion.div>
          </TabsContent>
        </Tabs>
      )}
      
      <AddFoodModal
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAddFood={handleAddMeal}
        mealType={addMealContext?.mealType as any}
      />
      
      <EditFoodModal
        isOpen={!!editingMeal}
        onClose={() => setEditingMeal(null)}
        onUpdate={handleUpdateMeal}
        loggedFood={editingMeal ? { logId: editingMeal.id, quantity: editingMeal.quantity } : null}
      />
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
