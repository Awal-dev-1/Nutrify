'use client';

import { useState, useMemo, type FC } from 'react';
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
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { mockFoods, type Food } from '@/lib/data';
import {
  mockTrackerData,
  userGoals,
  type LoggedFood,
} from '@/lib/tracker-data';
import { cn } from '@/lib/utils';
import {
  Plus,
  Trash2,
  Minus,
  GlassWater,
  Flame,
  ChevronLeft,
  ChevronRight,
  ClipboardX,
  PlusCircle,
  Pencil,
  Beef,
  Wheat,
  Droplets,
  UtensilsCrossed,
  Calendar,
  MoreVertical,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { EmptyState } from '@/components/shared/empty-state';
import { AddFoodModal } from '@/components/tracker/add-food-modal';
import { EditFoodModal } from '@/components/tracker/edit-food-modal';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';

// Helper function to calculate nutrient values based on quantity
const calculateNutrients = (food: Food, quantity: number) => {
  const ratio = quantity / 100;
  return {
    calories: food.calories * ratio,
    protein: food.protein * ratio,
    carbs: food.carbs * ratio,
    fat: food.fat * ratio,
  };
};

export default function DailyTrackerPage() {
  const { toast } = useToast();
  const [date, setDate] = useState(new Date());
  const [loggedFoods, setLoggedFoods] = useState(mockTrackerData);
  const [waterIntake, setWaterIntake] = useState(5);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [mealToAdd, setMealToAdd] = useState<MealType | null>(null);
  const [editingFood, setEditingFood] = useState<LoggedFood | null>(null);

  const dailyTotals = useMemo(() => {
    return loggedFoods.reduce(
      (acc, logged) => {
        const foodDetails = mockFoods.find((f) => f.id === logged.foodId);
        if (!foodDetails) return acc;
        const nutrients = calculateNutrients(foodDetails, logged.quantity);
        acc.calories += nutrients.calories;
        acc.protein += nutrients.protein;
        acc.carbs += nutrients.carbs;
        acc.fat += nutrients.fat;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [loggedFoods]);

  const meals = useMemo(() => {
    const mealData: Record<MealType, LoggedFood[]> = {
      Breakfast: [],
      Lunch: [],
      Dinner: [],
      Snacks: [],
    };
    loggedFoods.forEach((food) => {
      mealData[food.mealType].push(food);
    });
    return mealData;
  }, [loggedFoods]);

  const handleAddFood = (food: Food, quantity: number, mealType: MealType) => {
    const newLog: LoggedFood = {
      logId: Date.now().toString(),
      foodId: food.id,
      mealType,
      quantity,
    };
    setLoggedFoods((prev) => [...prev, newLog]);
    toast({
      title: 'Food Added!',
      description: `${food.name} added to ${mealType}.`,
    });
  };

  const handleUpdateFood = (logId: string, newQuantity: number) => {
    setLoggedFoods((prev) =>
      prev.map((log) =>
        log.logId === logId ? { ...log, quantity: newQuantity } : log
      )
    );
    toast({
      title: 'Portion Updated!',
      description: `The portion has been updated successfully.`,
    });
  };

  const handleDeleteFood = (logId: string) => {
    setLoggedFoods((prev) => prev.filter((log) => log.logId !== logId));
    toast({
      variant: 'destructive',
      title: 'Food Removed!',
      description: `The item has been removed from your log.`,
    });
  };

  const openAddModal = (mealType: MealType) => {
    setMealToAdd(mealType);
    setAddModalOpen(true);
  };

  const openEditModal = (food: LoggedFood) => {
    setEditingFood(food);
  };

  const clearDay = () => {
    setLoggedFoods([]);
    setWaterIntake(0);
    toast({
      title: 'Day Cleared',
      description: 'Your log for this day has been reset.',
    });
  };

  if (loggedFoods.length === 0) {
    return (
      <div className="space-y-8">
        <Header onClearDay={clearDay} date={date} setDate={setDate} />
        <EmptyState
          icon={<ClipboardX className="h-16 w-16 text-muted-foreground" />}
          title="No meals added today"
          description="Start tracking your intake to see your progress and meet your goals."
          className="border-2 border-dashed rounded-2xl py-16"
        >
          <Button
            onClick={() => openAddModal('Breakfast')}
            size="lg"
            className="mt-4"
          >
            <PlusCircle className="mr-2 h-5 w-5" /> Add Your First Meal
          </Button>
        </EmptyState>
        <AddFoodModal
          isOpen={isAddModalOpen}
          onClose={() => setAddModalOpen(false)}
          onAddFood={handleAddFood}
          mealType={mealToAdd}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <Header onClearDay={clearDay} date={date} setDate={setDate} />

      <DailySummary totals={dailyTotals} goals={userGoals} />

      <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2">
          <MealSections
            meals={meals}
            onAddFoodClick={openAddModal}
            onEditFoodClick={openEditModal}
            onDeleteFoodClick={handleDeleteFood}
          />
        </div>
        <div className="lg:col-span-1 space-y-6 md:space-y-8">
          <WaterTracker
            intake={waterIntake}
            setIntake={setWaterIntake}
            goal={userGoals.water}
          />
          <MacroChart data={dailyTotals} />
        </div>
      </div>

      <AddFoodModal
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAddFood={handleAddFood}
        mealType={mealToAdd}
      />
      <EditFoodModal
        isOpen={!!editingFood}
        onClose={() => setEditingFood(null)}
        onUpdate={handleUpdateFood}
        loggedFood={editingFood}
      />
    </div>
  );
}

// Sub-components for better organization

const Header: FC<{
  onClearDay: () => void;
  date: Date;
  setDate: (date: Date) => void;
}> = ({ onClearDay, date, setDate }) => {
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Daily Tracker
            </h1>
            <div className="text-sm md:text-base text-muted-foreground flex items-center gap-2">
              <span
                className={cn(
                  'inline-block w-2 h-2 rounded-full',
                  isToday ? 'bg-green-500' : 'bg-primary'
                )}
              ></span>
              <span>
                {date.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              {isToday && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  Today
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        <div className="flex items-center gap-1 border rounded-lg p-1 bg-background">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setDate(new Date(date.setDate(date.getDate() - 1)))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs md:text-sm"
            onClick={() => setDate(new Date())}
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setDate(new Date(date.setDate(date.getDate() + 1)))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive h-9"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Clear Day</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="sm:max-w-md w-[95vw] rounded-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-destructive/10">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </div>
                Clear today's data?
              </AlertDialogTitle>
              <AlertDialogDescription className="pt-2">
                This will permanently delete all logged food and water for this
                day. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onClearDay}
                className="bg-destructive hover:bg-destructive/90"
              >
                Clear Day
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

const DailySummary: FC<{ totals: any; goals: any }> = ({ totals, goals }) => {
  const calorieProgress = (totals.calories / goals.calories) * 100;
  const remainingCalories = Math.max(0, goals.calories - totals.calories);
  const proteinProgress = (totals.protein / goals.protein) * 100;
  const carbsProgress = (totals.carbs / goals.carbs) * 100;
  const fatProgress = (totals.fat / goals.fat) * 100;

  return (
    <Card className="overflow-hidden border-0 shadow-md">
      <CardContent className="p-0">
        {/* Mobile Layout (stacked) */}
        <div className="block md:hidden">
          {/* Calories Ring */}
          <div className="p-6 flex items-center justify-center border-b">
            <div className="relative w-40 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { value: totals.calories },
                      { value: remainingCalories },
                    ]}
                    dataKey="value"
                    innerRadius={50}
                    outerRadius={65}
                    startAngle={90}
                    endAngle={450}
                    cornerRadius={10}
                    stroke="none"
                  >
                    <Cell fill="hsl(var(--primary))" />
                    <Cell fill="hsl(var(--muted))" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">
                  {Math.round(totals.calories)}
                </span>
                <span className="text-xs text-muted-foreground">
                  of {goals.calories}
                </span>
              </div>
            </div>
          </div>

          {/* Remaining Stats */}
          <div className="p-6 space-y-4 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Flame className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className="text-2xl font-bold">
                  {Math.round(remainingCalories)} kcal
                </p>
              </div>
            </div>
            <Progress value={calorieProgress} className="h-2" />
          </div>

          {/* Macros */}
          <div className="p-6 grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="inline-flex p-2 rounded-full bg-red-50 dark:bg-red-950/20 mb-2">
                <Beef className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-sm font-medium">
                {Math.round(totals.protein)}g
              </p>
              <p className="text-xs text-muted-foreground">Protein</p>
              <Progress
                value={proteinProgress}
                className="h-1 mt-2 [&>div]:bg-red-500"
              />
            </div>
            <div className="text-center">
              <div className="inline-flex p-2 rounded-full bg-yellow-50 dark:bg-yellow-950/20 mb-2">
                <Wheat className="h-4 w-4 text-yellow-600" />
              </div>
              <p className="text-sm font-medium">
                {Math.round(totals.carbs)}g
              </p>
              <p className="text-xs text-muted-foreground">Carbs</p>
              <Progress
                value={carbsProgress}
                className="h-1 mt-2 [&>div]:bg-yellow-600"
              />
            </div>
            <div className="text-center">
              <div className="inline-flex p-2 rounded-full bg-blue-50 dark:bg-blue-950/20 mb-2">
                <Droplets className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-sm font-medium">{Math.round(totals.fat)}g</p>
              <p className="text-xs text-muted-foreground">Fat</p>
              <Progress
                value={fatProgress}
                className="h-1 mt-2 [&>div]:bg-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Desktop Layout (3 columns) */}
        <div className="hidden md:grid md:grid-cols-3 divide-x">
          {/* Calories Ring */}
          <div className="p-6 flex items-center justify-center">
            <div className="relative w-40 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { value: totals.calories },
                      { value: remainingCalories },
                    ]}
                    dataKey="value"
                    innerRadius={50}
                    outerRadius={65}
                    startAngle={90}
                    endAngle={450}
                    cornerRadius={10}
                    stroke="none"
                  >
                    <Cell fill="hsl(var(--primary))" />
                    <Cell fill="hsl(var(--muted))" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">
                  {Math.round(totals.calories)}
                </span>
                <span className="text-xs text-muted-foreground">
                  of {goals.calories}
                </span>
              </div>
            </div>
          </div>

          {/* Remaining Stats */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Flame className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className="text-2xl font-bold">
                  {Math.round(remainingCalories)} kcal
                </p>
              </div>
            </div>
            <Progress value={calorieProgress} className="h-2" />
          </div>

          {/* Macros */}
          <div className="p-6 grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="inline-flex p-2 rounded-full bg-red-50 dark:bg-red-950/20 mb-2">
                <Beef className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-sm font-medium">
                {Math.round(totals.protein)}g
              </p>
              <p className="text-xs text-muted-foreground">Protein</p>
              <Progress
                value={proteinProgress}
                className="h-1 mt-2 [&>div]:bg-red-500"
              />
            </div>
            <div className="text-center">
              <div className="inline-flex p-2 rounded-full bg-yellow-50 dark:bg-yellow-950/20 mb-2">
                <Wheat className="h-4 w-4 text-yellow-600" />
              </div>
              <p className="text-sm font-medium">
                {Math.round(totals.carbs)}g
              </p>
              <p className="text-xs text-muted-foreground">Carbs</p>
              <Progress
                value={carbsProgress}
                className="h-1 mt-2 [&>div]:bg-yellow-600"
              />
            </div>
            <div className="text-center">
              <div className="inline-flex p-2 rounded-full bg-blue-50 dark:bg-blue-950/20 mb-2">
                <Droplets className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-sm font-medium">{Math.round(totals.fat)}g</p>
              <p className="text-xs text-muted-foreground">Fat</p>
              <Progress
                value={fatProgress}
                className="h-1 mt-2 [&>div]:bg-blue-500"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const MealSections: FC<{
  meals: Record<MealType, LoggedFood[]>;
  onAddFoodClick: (mealType: MealType) => void;
  onEditFoodClick: (food: LoggedFood) => void;
  onDeleteFoodClick: (logId: string) => void;
}> = ({ meals, onAddFoodClick, onEditFoodClick, onDeleteFoodClick }) => {
  const mealOrder: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

  const getMealIcon = (mealType: MealType) => {
    switch (mealType) {
      case 'Breakfast':
        return '🍳';
      case 'Lunch':
        return '🥗';
      case 'Dinner':
        return '🍽️';
      case 'Snacks':
        return '🍪';
      default:
        return '🍽️';
    }
  };

  const totalMealsCount = Object.values(meals).flat().length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Today's Meals</h2>
        <Badge variant="outline" className="px-3 py-1">
          {totalMealsCount} {totalMealsCount === 1 ? 'item' : 'items'}
        </Badge>
      </div>

      <Accordion type="multiple" defaultValue={mealOrder} className="space-y-3">
        {mealOrder.map((mealType) => {
          const loggedItems = meals[mealType];
          const totalCalories = loggedItems.reduce((acc, log) => {
            const food = mockFoods.find((f) => f.id === log.foodId);
            return (
              acc + (food ? calculateNutrients(food, log.quantity).calories : 0)
            );
          }, 0);

          return (
            <Card key={mealType} className="overflow-hidden border shadow-sm">
              <AccordionItem value={mealType} className="border-0">
                <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 transition-colors">
                  <div className="flex justify-between w-full items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{getMealIcon(mealType)}</span>
                      <h3 className="font-semibold">{mealType}</h3>
                      {loggedItems.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {loggedItems.length}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground font-medium">
                        {Math.round(totalCalories)} kcal
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0 border-t">
                  <div className="space-y-3 pt-4">
                    {loggedItems.length > 0 ? (
                      loggedItems.map((log) => (
                        <LoggedFoodItem
                          key={log.logId}
                          loggedFood={log}
                          onEdit={onEditFoodClick}
                          onDelete={onDeleteFoodClick}
                        />
                      ))
                    ) : (
                      <div className="py-8 text-center border border-dashed rounded-lg">
                        <UtensilsCrossed className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">
                          No food logged for {mealType}.
                        </p>
                      </div>
                    )}
                    <div className="flex justify-end pt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onAddFoodClick(mealType)}
                        className="text-muted-foreground hover:text-foreground gap-2"
                      >
                        <Plus className="h-4 w-4" /> Add Food
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Card>
          );
        })}
      </Accordion>
    </div>
  );
};

const LoggedFoodItem: FC<{
  loggedFood: LoggedFood;
  onEdit: (food: LoggedFood) => void;
  onDelete: (logId: string) => void;
}> = ({ loggedFood, onEdit, onDelete }) => {
  const food = mockFoods.find((f) => f.id === loggedFood.foodId);
  if (!food) return null;
  const nutrients = calculateNutrients(food, loggedFood.quantity);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group">
      <div className="flex items-center gap-3 flex-1">
        <div className="flex-grow min-w-0">
          <p className="font-semibold truncate">{food.name}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{loggedFood.quantity}g</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Beef className="h-3 w-3 text-red-500" />
              {nutrients.protein.toFixed(0)}g
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Wheat className="h-3 w-3 text-yellow-600" />
              {nutrients.carbs.toFixed(0)}g
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Droplets className="h-3 w-3 text-blue-500" />
              {nutrients.fat.toFixed(0)}g
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-4">
        <p className="font-medium text-sm sm:text-base">
          {Math.round(nutrients.calories)} kcal
        </p>

        {/* Desktop hover actions */}
        <div className="hidden sm:flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(loggedFood)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="w-[95vw] max-w-md rounded-lg">
              <AlertDialogHeader>
                <AlertDialogTitle>Remove {food.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove this item from your meal log.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(loggedFood.logId)}>
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Mobile dropdown menu */}
        <div className="sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(loggedFood)}>
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(loggedFood.logId)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

const WaterTracker: FC<{
  intake: number;
  setIntake: (intake: number) => void;
  goal: number;
}> = ({ intake, setIntake, goal }) => {
  const percentage = (intake / goal) * 100;

  return (
    <Card className="overflow-hidden border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <GlassWater className="h-5 w-5 text-blue-500" />
          Water Intake
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIntake(Math.max(0, intake - 1))}
            className="h-10 w-10 rounded-full"
            disabled={intake === 0}
          >
            <Minus className="h-4 w-4" />
          </Button>

          <div className="text-center">
            <span className="text-4xl font-bold">{intake}</span>
            <span className="text-muted-foreground ml-2">/ {goal}</span>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setIntake(intake + 1)}
            className="h-10 w-10 rounded-full"
            disabled={intake >= goal}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <Progress value={percentage} className="h-2 [&>div]:bg-blue-500" />

        <div className="grid grid-cols-4 gap-1">
          {Array.from({ length: goal }).map((_, i) => (
            <div key={i} className="relative flex justify-center">
              <GlassWater
                className={cn(
                  'h-6 w-6 transition-all',
                  i < intake
                    ? 'text-blue-500 fill-blue-500/20'
                    : 'text-muted-foreground/20'
                )}
              />
              {i === intake - 1 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              )}
            </div>
          ))}
        </div>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">
            {percentage.toFixed(0)}% of daily goal
          </span>
          {percentage >= 100 && (
            <Badge variant="default" className="ml-2 text-xs">
              Goal met!
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const MacroChart: FC<{ data: any }> = ({ data }) => {
  const { protein, carbs, fat } = data;
  const totalMacros = protein + carbs + fat;

  if (totalMacros === 0) {
    return (
      <Card className="overflow-hidden border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Macro Distribution</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px]">
          <div className="text-center">
            <PieChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Log meals to see distribution
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = [
    { name: 'Protein', value: protein, color: 'hsl(var(--chart-2))' },
    { name: 'Carbs', value: carbs, color: 'hsl(var(--chart-3))' },
    { name: 'Fat', value: fat, color: 'hsl(var(--chart-4))' },
  ];

  return (
    <Card className="overflow-hidden border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-2))]" />
            <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-3))]" />
            <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-4))]" />
          </div>
          Macro Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              cornerRadius={4}
              labelLine={false}
              label={({ name, percent }) =>
                `${(percent * 100).toFixed(0)}%`
              }
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)',
                padding: '8px 12px',
              }}
              formatter={(value: number) => [`${value.toFixed(0)}g`, '']}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
            <p className="text-xs text-muted-foreground">Protein</p>
            <p className="text-sm font-bold">{protein.toFixed(0)}g</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
            <p className="text-xs text-muted-foreground">Carbs</p>
            <p className="text-sm font-bold">{carbs.toFixed(0)}g</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
            <p className="text-xs text-muted-foreground">Fat</p>
            <p className="text-sm font-bold">{fat.toFixed(0)}g</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
