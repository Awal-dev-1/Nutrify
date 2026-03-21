
"use client";

import { useState, useMemo, type FC } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
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
  Loader2,
  CheckCircle2,
  Apple,
  Coffee,
  Sun,
  Moon,
  Cookie,
  Salad,
  Egg,
  Fish,
  Banana,
  AlertCircle,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { AddFoodModal } from "@/components/tracker/add-food-modal";
import { EditFoodModal } from "@/components/tracker/edit-food-modal";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  useDoc,
  useUser,
  useFirestore,
  useMemoFirebase,
  errorEmitter,
  FirestorePermissionError,
} from "@/firebase";
import { doc, setDoc, collection } from "firebase/firestore";
import { format, subDays, addDays } from "date-fns";
import type { DailyLog, LoggedFoodItem } from "@/types/analytics";
import type { FoodItem as AiFoodItem } from "@/types/food";
import { Separator } from "@/components/ui/separator";

type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snacks";

export default function DailyTrackerPage() {
  const { toast } = useToast();
  const { user, userProfile } = useUser();
  const db = useFirestore();
  const [date, setDate] = useState(new Date());

  const dateKey = format(date, 'yyyy-MM-dd');
  const dailyLogRef = useMemoFirebase(
    () => (user ? doc(db, 'users', user.uid, 'dailyLogs', dateKey) : null),
    [user, db, dateKey]
  );
  
  const { data: dailyLog, isLoading: isLogLoading } = useDoc<DailyLog>(dailyLogRef);

  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [mealToAdd, setMealToAdd] = useState<MealType | null>(null);
  const [editingFood, setEditingFood] = useState<Pick<LoggedFoodItem, 'logId' | 'quantity'> | null>(null);
  
  const userGoals = userProfile?.goals || { dailyCalorieGoal: 2000, proteinPercentageGoal: 30, carbsPercentageGoal: 40, fatPercentageGoal: 30 };
  const derivedGoals = {
    calories: userGoals.dailyCalorieGoal,
    protein: (userGoals.dailyCalorieGoal * (userGoals.proteinPercentageGoal / 100)) / 4,
    carbs: (userGoals.dailyCalorieGoal * (userGoals.carbsPercentageGoal / 100)) / 4,
    fat: (userGoals.dailyCalorieGoal * (userGoals.fatPercentageGoal / 100)) / 9,
    water: 8,
  };

  const meals = useMemo(() => {
    return dailyLog?.meals || { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] };
  }, [dailyLog]);
  
  const dailyTotals = useMemo(() => {
    return dailyLog || { 
      totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0,
      totalIron: 0, totalVitaminA: 0, totalSodium: 0, totalFiber: 0,
      totalSugar: 0, totalCalcium: 0, totalVitaminC: 0,
      waterIntake: 0,
    };
  }, [dailyLog]);

  const updateDailyLog = (updatedMeals: Record<MealType, LoggedFoodItem[]>, water: number) => {
    if (!dailyLogRef) return;
    
    const allMeals = Object.values(updatedMeals).flat();
    const totals = allMeals.reduce((acc, item) => {
        acc.totalCalories += item.calories;
        acc.totalProtein += item.protein;
        acc.totalCarbs += item.carbs;
        acc.totalFat += item.fat;
        acc.totalIron += item.iron || 0;
        acc.totalVitaminA += item.vitaminA || 0;
        acc.totalSodium += item.sodium || 0;
        acc.totalFiber += item.fiber || 0;
        acc.totalSugar += item.sugar || 0;
        acc.totalCalcium += item.calcium || 0;
        acc.totalVitaminC += item.vitaminC || 0;
        return acc;
    }, { 
        totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, 
        totalIron: 0, totalVitaminA: 0, totalSodium: 0, totalFiber: 0,
        totalSugar: 0, totalCalcium: 0, totalVitaminC: 0
    });

    const newLog: DailyLog = {
      date: dateKey,
      meals: updatedMeals,
      waterIntake: water,
      ...totals
    };

    setDoc(dailyLogRef, newLog, { merge: true }).catch(error => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: dailyLogRef.path,
          operation: 'write',
          requestResourceData: newLog
      }));
    });
  };
  
  const handleAddFood = (foodData: AiFoodItem, quantity: number, mealType: MealType) => {
    if(!db) return;
    const ratio = quantity / 100;
    const newLogItem: LoggedFoodItem = {
      logId: doc(collection(db, 'temp')).id,
      foodId: foodData.foodName,
      name: foodData.foodName,
      quantity,
      calories: (foodData.calories || 0) * ratio,
      protein: (foodData.macronutrientBreakdown.protein || 0) * ratio,
      carbs: (foodData.macronutrientBreakdown.carbohydrates || 0) * ratio,
      fat: (foodData.macronutrientBreakdown.fat || 0) * ratio,
      iron: (foodData.micronutrientBreakdown?.iron || 0) * ratio,
      vitaminA: (foodData.micronutrientBreakdown?.vitaminA || 0) * ratio,
      sodium: (foodData.micronutrientBreakdown?.sodium || 0) * ratio,
      fiber: (foodData.micronutrientBreakdown?.fiber || 0) * ratio,
      sugar: (foodData.micronutrientBreakdown?.sugar || 0) * ratio,
      calcium: (foodData.micronutrientBreakdown?.calcium || 0) * ratio,
      vitaminC: (foodData.micronutrientBreakdown?.vitaminC || 0) * ratio,
    };
    
    const newMeals = { ...meals, [mealType]: [...meals[mealType], newLogItem] };
    updateDailyLog(newMeals, dailyTotals.waterIntake);
    
    toast({
      title: "Food Added!",
      description: `${foodData.foodName} added to ${mealType}.`,
    });
  };

  const handleUpdateFood = (logId: string, newQuantity: number) => {
    const newMeals = { ...meals };
    let foodName = '';
    for (const mealType in newMeals) {
        const mealKey = mealType as MealType;
        const itemIndex = newMeals[mealKey].findIndex(item => item.logId === logId);
        if (itemIndex > -1) {
            const originalItem = newMeals[mealKey][itemIndex];
            foodName = originalItem.name;
            const originalQuantity = originalItem.quantity;

            if (originalQuantity > 0) {
                const ratio = newQuantity / originalQuantity;
                newMeals[mealKey][itemIndex] = {
                    ...originalItem,
                    quantity: newQuantity,
                    calories: originalItem.calories * ratio,
                    protein: originalItem.protein * ratio,
                    carbs: originalItem.carbs * ratio,
                    fat: originalItem.fat * ratio,
                    iron: (originalItem.iron || 0) * ratio,
                    vitaminA: (originalItem.vitaminA || 0) * ratio,
                    sodium: (originalItem.sodium || 0) * ratio,
                    fiber: (originalItem.fiber || 0) * ratio,
                    sugar: (originalItem.sugar || 0) * ratio,
                    calcium: (originalItem.calcium || 0) * ratio,
                    vitaminC: (originalItem.vitaminC || 0) * ratio,
                };
            }
            break;
        }
    }

    updateDailyLog(newMeals, dailyTotals.waterIntake);
    toast({
        title: "Portion Updated!",
        description: `The portion for ${foodName} has been updated.`,
    });
  };
  
  const handleDeleteFood = (logId: string) => {
    const newMeals = { ...meals };
    let foodName = '';
     for (const mealType in newMeals) {
        const mealKey = mealType as MealType;
        const originalLength = newMeals[mealKey].length;
        newMeals[mealKey] = newMeals[mealKey].filter(item => {
            if(item.logId === logId) {
                foodName = item.name;
                return false;
            }
            return true;
        });
        if (newMeals[mealKey].length < originalLength) break;
    }
    updateDailyLog(newMeals, dailyTotals.waterIntake);
    toast({
        variant: "destructive",
        title: "Food Removed!",
        description: `${foodName} has been removed from your log.`,
    });
  };

  const handleWaterChange = (newIntake: number) => {
    updateDailyLog(meals, newIntake);
  }

  const openAddModal = (mealType: MealType) => {
    setMealToAdd(mealType);
    setAddModalOpen(true);
  };
  
  const openEditModal = (food: LoggedFoodItem) => {
    setEditingFood({ logId: food.logId, quantity: food.quantity });
  };

  const clearDay = () => {
    if(dailyLogRef) {
        const emptyLog: DailyLog = {
            date: dateKey,
            meals: { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] },
            waterIntake: 0,
            totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0,
            totalIron: 0, totalVitaminA: 0, totalSodium: 0, totalFiber: 0,
            totalSugar: 0, totalCalcium: 0, totalVitaminC: 0
        };
        setDoc(dailyLogRef, emptyLog, { merge: false }).catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: dailyLogRef.path,
                operation: 'write',
                requestResourceData: emptyLog
            }));
        });
    }
    toast({
      title: "Day Cleared",
      description: "Your log for this day has been reset.",
    });
  };

  if (isLogLoading) {
    return (
      <div className="flex flex-col h-[70vh] items-center justify-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse"></div>
          <Loader2 className="h-12 w-12 animate-spin text-primary relative" />
        </div>
        <p className="text-muted-foreground animate-pulse">Loading your daily tracker...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Header onClearDay={clearDay} date={date} setDate={setDate} />

      {!dailyLog || Object.values(meals).flat().length === 0 ? (
        <EmptyState
          icon={<ClipboardX className="h-16 w-16 text-muted-foreground" />}
          title="No meals logged yet"
          description="Start tracking your nutrition by adding your first meal of the day."
        >
          <Button 
            onClick={() => openAddModal('Breakfast')} 
            size="lg" 
            className="mt-4 shadow-lg hover:shadow-xl transition-shadow"
          >
            <PlusCircle className="mr-2 h-5 w-5" /> 
            Add Your First Meal
          </Button>
        </EmptyState>
      ) : (
        <>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <CalorieSummaryCard totals={dailyTotals} goal={derivedGoals.calories} />
              <MacroPieChart totals={dailyTotals} />
              <MicroNutrientGrid totals={dailyTotals} />
              <MealSections 
                meals={meals} 
                onAddFoodClick={openAddModal} 
                onEditFoodClick={openEditModal} 
                onDeleteFoodClick={handleDeleteFood} 
              />
            </div>
            <div className="lg:col-span-1 space-y-8">
              <WaterTracker intake={dailyTotals.waterIntake} setIntake={handleWaterChange} goal={derivedGoals.water} />
            </div>
          </div>
        </>
      )}
      
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

// Enhanced Header Component
const Header: FC<{onClearDay: () => void; date: Date; setDate: (date: Date) => void}> = ({ onClearDay, date, setDate }) => {
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-sm">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Daily Tracker
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-lg text-muted-foreground">
                {format(date, "EEEE, MMMM d")}
              </p>
              {isToday && (
                <Badge variant="secondary" className="rounded-full px-3 py-0.5 text-xs font-medium">
                  Today
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="flex items-center gap-1 bg-muted/30 rounded-2xl p-1.5 border shadow-sm">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 rounded-xl hover:bg-background"
            onClick={() => setDate(subDays(date, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-9 px-4 rounded-xl text-sm font-medium hover:bg-background"
            onClick={() => setDate(new Date())}
            disabled={isToday}
          >
            Today
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 rounded-xl hover:bg-background"
            onClick={() => setDate(addDays(date, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="outline" 
              size="icon"
              className="h-11 w-11 rounded-xl border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 rounded-full bg-destructive/10">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                </div>
                Clear today's data?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base pt-2">
                This will permanently delete all logged meals and water intake for this day. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onClearDay} className="rounded-xl bg-destructive hover:bg-destructive/90">
                Clear Day
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

// Enhanced Calorie Summary Card
const CalorieSummaryCard: FC<{ totals: DailyLog; goal: number }> = ({ totals, goal }) => {
  const calorieProgress = Math.min((totals.totalCalories / goal) * 100, 100);
  const remainingCalories = Math.max(0, goal - totals.totalCalories);
  const isOverGoal = totals.totalCalories > goal;

  return (
    <Card className="overflow-hidden border shadow-lg">
      <CardContent className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Daily Calories</h3>
          <Badge variant="outline" className={cn(
            "rounded-full px-3 py-1 text-sm",
            isOverGoal ? "border-destructive text-destructive" : "border-primary text-primary"
          )}>
            <Flame className="h-3.5 w-3.5 mr-1" />
            {Math.round(totals.totalCalories)} / {goal}
          </Badge>
        </div>
        
        <div className="space-y-6">
          <div className="relative">
            <Progress value={calorieProgress} className="h-3" />
            <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>{Math.round(goal * 0.5)}</span>
              <span>{goal}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-muted/30">
              <p className="text-sm text-muted-foreground mb-1">Consumed</p>
              <p className="text-2xl font-bold">{Math.round(totals.totalCalories)}</p>
              <p className="text-xs text-muted-foreground mt-1">kcal</p>
            </div>
            <div className="p-4 rounded-xl bg-primary/5">
              <p className="text-sm text-muted-foreground mb-1">Remaining</p>
              <p className="text-2xl font-bold text-primary">{Math.round(remainingCalories)}</p>
              <p className="text-xs text-muted-foreground mt-1">kcal</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Enhanced Macro Pie Chart
const MacroPieChart: FC<{ totals: DailyLog }> = ({ totals }) => {
  const proteinCalories = totals.totalProtein * 4;
  const carbsCalories = totals.totalCarbs * 4;
  const fatCalories = totals.totalFat * 9;
  const totalMacroCalories = proteinCalories + carbsCalories + fatCalories;

  if (totalMacroCalories === 0) {
    return (
      <Card className="border shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Macronutrients</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-center">
            <div className="inline-flex p-3 rounded-full bg-muted mb-3">
              <UtensilsCrossed className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Add a meal to see your macro breakdown</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const data = [
    { name: 'Protein', value: proteinCalories, color: '#ef4444' },
    { name: 'Carbs', value: carbsCalories, color: '#eab308' },
    { name: 'Fat', value: fatCalories, color: '#3b82f6' },
  ];
  
  return (
    <Card className="border shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Macronutrient Balance</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-6">
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  padding: '8px 12px',
                }}
                formatter={(value: number) => `${Math.round(value)} kcal`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="space-y-4">
          {data.map(item => {
            const percentage = ((item.value / totalMacroCalories) * 100).toFixed(0);
            return (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">{Math.round(item.value)} kcal</span>
                  <Badge variant="secondary" className="min-w-[45px] text-center">
                    {percentage}%
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// Enhanced Meal Sections
const MealSections: FC<{
  meals: Record<MealType, LoggedFoodItem[]>; 
  onAddFoodClick: (mealType: MealType) => void; 
  onEditFoodClick: (food: LoggedFoodItem) => void; 
  onDeleteFoodClick: (logId: string) => void;
}> = ({meals, onAddFoodClick, onEditFoodClick, onDeleteFoodClick}) => {
  const mealOrder: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

  const getMealIcon = (mealType: MealType) => {
    switch(mealType) {
      case 'Breakfast': return <Coffee className="h-5 w-5 text-amber-500" />;
      case 'Lunch': return <Sun className="h-5 w-5 text-orange-500" />;
      case 'Dinner': return <Moon className="h-5 w-5 text-indigo-500" />;
      case 'Snacks': return <Cookie className="h-5 w-5 text-pink-500" />;
      default: return <UtensilsCrossed className="h-5 w-5" />;
    }
  };

  const totalMealsCount = Object.values(meals).flat().length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Today's Meals</h2>
        {totalMealsCount > 0 && (
          <Badge variant="secondary" className="rounded-full px-4 py-1">
            {totalMealsCount} {totalMealsCount === 1 ? 'item' : 'items'}
          </Badge>
        )}
      </div>
      
      <Accordion type="multiple" defaultValue={mealOrder} className="space-y-4">
        {mealOrder.map(mealType => {
          const loggedItems = meals[mealType] || [];
          const totalCalories = loggedItems.reduce((acc, log) => acc + log.calories, 0);
          
          return (
            <Card key={mealType} className="overflow-hidden border shadow-lg">
              <AccordionItem value={mealType} className="border-0">
                <AccordionTrigger className="px-6 py-4 hover:bg-muted/20 transition-colors">
                  <div className="flex flex-1 items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
                        {getMealIcon(mealType)}
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-lg">{mealType}</h3>
                        {loggedItems.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            {loggedItems.length} {loggedItems.length === 1 ? 'item' : 'items'}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="px-3 py-1 text-sm">
                        {Math.round(totalCalories)} kcal
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 pt-2">
                  <div className="space-y-3">
                    {loggedItems.length > 0 ? (
                      loggedItems.map(log => (
                        <LoggedFoodItemComponent
                          key={log.logId} 
                          loggedFood={log} 
                          onEdit={onEditFoodClick} 
                          onDelete={onDeleteFoodClick} 
                        />
                      ))
                    ) : (
                      <div className="py-12 text-center">
                        <div className="inline-flex p-4 rounded-full bg-muted/50 mb-3">
                          <UtensilsCrossed className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          No food logged for {mealType}
                        </p>
                      </div>
                    )}
                    
                    <Button 
                      size="default" 
                      variant="outline" 
                      onClick={() => onAddFoodClick(mealType)}
                      className="w-full mt-2 rounded-xl border-dashed hover:border-primary hover:text-primary transition-all"
                    >
                      <Plus className="h-4 w-4 mr-2" /> 
                      Add to {mealType}
                    </Button>
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

// Enhanced Logged Food Item
const LoggedFoodItemComponent: FC<{
  loggedFood: LoggedFoodItem; 
  onEdit: (food: LoggedFoodItem) => void; 
  onDelete: (logId: string) => void;
}> = ({loggedFood, onEdit, onDelete}) => {
  return (
    <div className="group relative">
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative p-4 rounded-xl border bg-card hover:shadow-md transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold truncate">{loggedFood.name}</h4>
              <Badge variant="secondary" className="rounded-full text-xs px-2">
                {loggedFood.quantity}g
              </Badge>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <Beef className="h-3.5 w-3.5 text-red-500" />
                <span>{loggedFood.protein.toFixed(0)}g</span>
              </div>
              <span className="text-muted-foreground/50">•</span>
              <div className="flex items-center gap-1">
                <Wheat className="h-3.5 w-3.5 text-yellow-600" />
                <span>{loggedFood.carbs.toFixed(0)}g</span>
              </div>
              <span className="text-muted-foreground/50">•</span>
              <div className="flex items-center gap-1">
                <Droplets className="h-3.5 w-3.5 text-blue-500" />
                <span>{loggedFood.fat.toFixed(0)}g</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between sm:justify-end gap-4">
            <div className="text-right">
              <p className="font-bold text-primary">{Math.round(loggedFood.calories)}</p>
              <p className="text-xs text-muted-foreground">kcal</p>
            </div>
            
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-lg hover:bg-muted"
                onClick={() => onEdit(loggedFood)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove {loggedFood.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove this item from your meal log.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => onDelete(loggedFood.logId)} 
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Water Tracker
const WaterTracker: FC<{intake: number; setIntake: (intake: number) => void; goal: number}> = ({intake, setIntake, goal}) => {
  const progress = (intake / goal) * 100;
  const isGoalMet = intake >= goal;

  return (
    <Card className="overflow-hidden border shadow-lg sticky top-24">
      <CardHeader className="pb-4 bg-gradient-to-br from-blue-500/5 to-transparent">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-xl bg-blue-500/10">
            <GlassWater className="h-5 w-5 text-blue-500" />
          </div>
          Water Intake
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="flex items-center justify-between gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setIntake(Math.max(0, intake - 1))}
            className="h-12 w-12 rounded-xl border-2 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all"
            disabled={intake === 0}
          >
            <Minus className="h-5 w-5" />
          </Button>
          
          <div className="text-center flex-1">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-bold text-blue-500">{intake}</span>
              <span className="text-xl text-muted-foreground">/ {goal}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">glasses</p>
          </div>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setIntake(intake + 1)}
            className="h-12 w-12 rounded-xl border-2 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2.5" indicatorStyle={{ backgroundColor: 'hsl(210 100% 50%)' }} />
        </div>
        
        {isGoalMet && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">Daily water goal achieved!</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Enhanced Micronutrient Grid
const MicroNutrientGrid: FC<{ totals: DailyLog }> = ({ totals }) => (
  <Card className="border shadow-lg">
    <CardHeader className="pb-3">
      <CardTitle className="text-lg">Micronutrients</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <MicroStat label="Fiber" value={totals.totalFiber} unit="g" />
        <MicroStat label="Sugar" value={totals.totalSugar} unit="g" />
        <MicroStat label="Sodium" value={totals.totalSodium} unit="mg" />
        <MicroStat label="Calcium" value={totals.totalCalcium} unit="mg" />
        <MicroStat label="Iron" value={totals.totalIron} unit="mg" />
        <MicroStat label="Vitamin A" value={totals.totalVitaminA} unit="µg" />
      </div>
    </CardContent>
  </Card>
);

const MicroStat: FC<{label: string, value: number, unit: string}> = ({ label, value, unit }) => (
  <div className="p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border text-center hover:shadow-md transition-shadow">
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <p className="text-lg font-bold">{Math.round(value)}<span className="text-sm font-normal text-muted-foreground ml-0.5">{unit}</span></p>
  </div>
);
