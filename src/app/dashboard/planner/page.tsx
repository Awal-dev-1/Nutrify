'use client';

import { useState, FC, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WeekPlanner } from '@/components/planner/week-planner';
import { DayPlanner } from '@/components/planner/day-planner';
import { PlannerControls } from '@/components/planner/planner-controls';
import {
  mockPlannerData,
  mockUserGoals,
  type PlannedMeal,
} from '@/lib/planner-data';
import { mockFoods, type Food } from '@/lib/data';
import { Calendar, CalendarDays, UtensilsCrossed } from 'lucide-react';

export default function MealPlannerPage() {
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>(
    mockPlannerData
  );

  const addMeal = (
    food: Food,
    quantity: number,
    mealType: string,
    day: string
  ) => {
    const newMeal: PlannedMeal = {
      id: Date.now().toString(),
      foodId: food.id,
      day,
      mealType,
      quantity,
    };
    setPlannedMeals((prev) => [...prev, newMeal]);
  };

  const removeMeal = (id: string) => {
    setPlannedMeals((prev) => prev.filter((meal) => meal.id !== id));
  };
  
  const updateMeal = (id: string, newQuantity: number) => {
      setPlannedMeals(prev => prev.map(meal => meal.id === id ? {...meal, quantity: newQuantity} : meal));
  };

  const generatePlan = () => {
    // Mock generation logic
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const mealTypes = ['Breakfast', 'Lunch', 'Dinner'];
    const newPlan: PlannedMeal[] = [];
    days.forEach(day => {
        mealTypes.forEach(mealType => {
            const randomFood = mockFoods[Math.floor(Math.random() * mockFoods.length)];
            newPlan.push({
                id: `${day}-${mealType}-${Math.random()}`,
                foodId: randomFood.id,
                day,
                mealType,
                quantity: 150
            });
        });
    });
    setPlannedMeals(newPlan);
  };

  const clearPlan = () => {
    setPlannedMeals([]);
  };

  const weeklySummary = useMemo(() => {
    const summary = mockFoods.reduce((acc, food) => {
      acc[food.id] = food;
      return acc;
    }, {} as Record<string, Food>);

    return plannedMeals.reduce((acc, meal) => {
        const food = summary[meal.foodId];
        if (food) {
            if (!acc[meal.day]) {
                acc[meal.day] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
            }
            const ratio = meal.quantity / 100;
            acc[meal.day].calories += food.calories * ratio;
            acc[meal.day].protein += food.protein * ratio;
            acc[meal.day].carbs += food.carbs * ratio;
            acc[meal.day].fat += food.fat * ratio;
        }
        return acc;
    }, {} as Record<string, {calories: number, protein: number, carbs: number, fat: number}>);
  }, [plannedMeals]);

  const totalMeals = plannedMeals.length;
  const totalDays = [...new Set(plannedMeals.map(m => m.day))].length;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <UtensilsCrossed className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Meal Planner</h1>
              <p className="text-muted-foreground">
                Plan your meals ahead to stay consistent with your goals.
              </p>
            </div>
          </div>
          
          {/* Stats Cards - Mobile Only */}
          <div className="flex flex-wrap gap-3 pt-2 lg:hidden">
            <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{totalDays} days</span>
            </div>
            <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{totalMeals} meals</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          {/* Stats Cards - Desktop */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-lg">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Days</p>
                <p className="text-lg font-bold leading-tight">{totalDays}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-lg">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Meals</p>
                <p className="text-lg font-bold leading-tight">{totalMeals}</p>
              </div>
            </div>
          </div>
          
          <PlannerControls onGenerate={generatePlan} onClear={clearPlan} />
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="week" className="w-full">
        <div className="flex justify-center sm:justify-start mb-6">
          <TabsList className="grid w-full max-w-[280px] grid-cols-2 p-1">
            <TabsTrigger value="week" className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Week</span>
              <span className="sm:hidden">7d</span>
            </TabsTrigger>
            <TabsTrigger value="day" className="flex items-center gap-2 text-sm">
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Day</span>
              <span className="sm:hidden">24h</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="week" className="mt-0">
          <Card className="border-2">
            <CardHeader className="border-b bg-muted/5 px-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Weekly Overview</CardTitle>
                  <CardDescription>
                    Plan your entire week at a glance
                  </CardDescription>
                </div>
                <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  {totalMeals} meals planned
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <WeekPlanner 
                plannedMeals={plannedMeals}
                onAddMeal={addMeal}
                onUpdateMeal={updateMeal}
                onRemoveMeal={removeMeal}
                summary={weeklySummary}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="day" className="mt-0">
          <Card className="border-2">
            <CardHeader className="border-b bg-muted/5 px-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Daily Details</CardTitle>
                  <CardDescription>
                    Focus on one day at a time
                  </CardDescription>
                </div>
                <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  {totalDays} active days
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <DayPlanner 
                plannedMeals={plannedMeals}
                onAddMeal={addMeal}
                onUpdateMeal={updateMeal}
                onRemoveMeal={removeMeal}
                summary={weeklySummary}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Tips - Optional */}
      {plannedMeals.length === 0 && (
        <div className="text-center p-8 rounded-lg border-2 border-dashed">
          <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium mb-2">Start planning your meals</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Generate a suggested plan or add meals manually to get started with your weekly meal planning.
          </p>
        </div>
      )}
    </div>
  );
}