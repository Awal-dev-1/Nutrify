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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Meal Planner</h1>
          <p className="text-muted-foreground">
            Plan your meals ahead to stay consistent with your goals.
          </p>
        </div>
        <PlannerControls onGenerate={generatePlan} onClear={clearPlan} />
      </div>

      <Tabs defaultValue="week" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="week">Week Planner</TabsTrigger>
          <TabsTrigger value="day">Day Planner</TabsTrigger>
        </TabsList>
        <TabsContent value="week">
          <Card>
            <CardContent className="p-2 sm:p-4">
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
        <TabsContent value="day">
            <DayPlanner 
                 plannedMeals={plannedMeals}
                onAddMeal={addMeal}
                onUpdateMeal={updateMeal}
                onRemoveMeal={removeMeal}
                summary={weeklySummary}
            />
        </TabsContent>
      </Tabs>
    </div>
  );
}
