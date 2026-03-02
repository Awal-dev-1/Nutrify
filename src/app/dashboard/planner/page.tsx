'use client';

import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DayPlanner } from '@/components/planner/day-planner';
import { WeekPlanner } from '@/components/planner/week-planner';
import { PlannerControls } from '@/components/planner/planner-controls';
import type { PlannedMeal } from '@/lib/planner-data';
import { mockPlannerData } from '@/lib/planner-data';
import { mockFoods, type Food } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

export default function MealPlannerPage() {
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>(mockPlannerData);
  const { toast } = useToast();

  const summary = useMemo(() => {
    const foodMap = mockFoods.reduce((acc, food) => {
      acc[food.id] = food;
      return acc;
    }, {} as Record<string, Food>);

    return plannedMeals.reduce((acc, meal) => {
      const food = foodMap[meal.foodId];
      if (!food) return acc;
      
      const calories = food.calories * (meal.quantity / 100);
      const protein = food.protein * (meal.quantity / 100);
      const carbs = food.carbs * (meal.quantity / 100);
      const fat = food.fat * (meal.quantity / 100);

      if (!acc[meal.day]) {
        acc[meal.day] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }
      acc[meal.day].calories += calories;
      acc[meal.day].protein += protein;
      acc[meal.day].carbs += carbs;
      acc[meal.day].fat += fat;

      return acc;
    }, {} as Record<string, { calories: number; protein: number; carbs: number; fat: number }>);
  }, [plannedMeals]);

  const handleAddMeal = (food: Food, quantity: number, mealType: string, day: string) => {
    const newMeal: PlannedMeal = {
      id: `plan-${Date.now()}`,
      foodId: food.id,
      day,
      mealType,
      quantity,
    };
    setPlannedMeals(prev => [...prev, newMeal]);
    toast({
        title: "Meal Added",
        description: `${food.name} has been added to your ${day} plan.`
    })
  };

  const handleUpdateMeal = (id: string, newQuantity: number) => {
    setPlannedMeals(prev =>
      prev.map(meal => (meal.id === id ? { ...meal, quantity: newQuantity } : meal))
    );
     toast({
        title: "Meal Updated",
        description: `The portion size has been updated.`
    })
  };

  const handleRemoveMeal = (id: string) => {
    setPlannedMeals(prev => prev.filter(meal => meal.id !== id));
    toast({
        variant: 'destructive',
        title: "Meal Removed",
        description: `The meal has been removed from your plan.`
    })
  };

  const handleGeneratePlan = () => {
    // This is a mock generation. A real implementation would use AI.
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const mealTypes = ['Breakfast', 'Lunch', 'Dinner'];
    const newPlan: PlannedMeal[] = [];
    
    daysOfWeek.forEach(day => {
      mealTypes.forEach(mealType => {
        const randomFood = mockFoods[Math.floor(Math.random() * mockFoods.length)];
        newPlan.push({
          id: `gen-${day}-${mealType}-${Date.now()}`,
          foodId: randomFood.id,
          day: day,
          mealType: mealType,
          quantity: mealType === 'Lunch' || mealType === 'Dinner' ? 200 : 100,
        });
      });
    });

    setPlannedMeals(newPlan);
  };

  const handleClearPlan = () => {
    setPlannedMeals([]);
     toast({
        variant: 'destructive',
        title: "Plan Cleared",
        description: `Your meal plan has been reset.`
    })
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meal Planner</h1>
          <p className="text-muted-foreground">
            Plan your meals ahead to stay consistent with your goals.
          </p>
        </div>
        <PlannerControls onGenerate={handleGeneratePlan} onClear={handleClearPlan} />
      </div>

      {/* 2. Planner Mode Toggle */}
      <Tabs defaultValue="week" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="week">Week Planner</TabsTrigger>
          <TabsTrigger value="day">Day Planner</TabsTrigger>
        </TabsList>

        {/* 3B. Week Planner Content */}
        <TabsContent value="week" className="mt-6">
          <WeekPlanner 
            plannedMeals={plannedMeals} 
            summary={summary}
            onAddMeal={handleAddMeal}
            onUpdateMeal={handleUpdateMeal}
            onRemoveMeal={handleRemoveMeal}
          />
        </TabsContent>

        {/* 3A. Day Planner Content */}
        <TabsContent value="day" className="mt-6">
          <DayPlanner 
            plannedMeals={plannedMeals}
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
