
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
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <Header onClearDay={clearDay} date={date} setDate={setDate} />

      {!dailyLog || Object.values(meals).flat().length === 0 ? (
         <EmptyState
          icon={<ClipboardX className="h-16 w-16 text-muted-foreground" />}
          title="No Records Yet"
          description="You haven’t logged any meals today. Add a meal to get started."
        >
          <Button onClick={() => openAddModal('Breakfast')} size="lg" className="mt-4">
            <PlusCircle className="mr-2 h-5 w-5" /> Add Your First Meal
          </Button>
        </EmptyState>
      ) : (
        <>
          <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 space-y-6">
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
            <div className="lg:col-span-1 space-y-6 md:space-y-8">
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

// Sub-components for better organization

const Header: FC<{onClearDay: () => void; date: Date; setDate: (date: Date) => void}> = ({ onClearDay, date, setDate }) => {
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
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Daily Tracker</h1>
            <div className="text-sm md:text-base text-muted-foreground flex items-center gap-2">
              <span>{format(date, "EEEE, MMMM d")}</span>
              {isToday && <Badge variant="secondary" className="ml-2 text-xs">Today</Badge>}
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
            onClick={() => setDate(subDays(date, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-3 text-xs md:text-sm"
            onClick={() => setDate(new Date())}
            disabled={isToday}
          >
            Today
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => setDate(addDays(date, 1))}
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
                Clear this day's data?
              </AlertDialogTitle>
              <AlertDialogDescription className="pt-2">
                This will permanently delete all logged food and water for this day. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onClearDay} className="bg-destructive hover:bg-destructive/90">
                Clear Day
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

const CalorieSummaryCard: FC<{ totals: DailyLog; goal: number }> = ({ totals, goal }) => {
  const calorieProgress = (totals.totalCalories / goal) * 100;
  const remainingCalories = Math.max(0, goal - totals.totalCalories);

  return (
    <Card className="overflow-hidden border-2 shadow-sm">
      <CardContent className="p-6 flex flex-col justify-center">
        <CardTitle className="text-lg mb-4">Calorie Summary</CardTitle>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Consumed</p>
            <p className="text-2xl font-bold">{Math.round(totals.totalCalories)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p className="text-2xl font-bold text-primary">{Math.round(remainingCalories)}</p>
          </div>
          <div className="space-y-1 col-span-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>Goal: {goal} kcal</span>
            </div>
            <Progress value={calorieProgress} className="h-2.5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const MacroPieChart: FC<{ totals: DailyLog }> = ({ totals }) => {
    const proteinCalories = totals.totalProtein * 4;
    const carbsCalories = totals.totalCarbs * 4;
    const fatCalories = totals.totalFat * 9;
    const totalMacroCalories = proteinCalories + carbsCalories + fatCalories;

    if (totalMacroCalories === 0) {
        return (
             <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Macronutrient Distribution</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-48">
                    <p className="text-sm text-muted-foreground">Log a meal to see your macro split.</p>
                </CardContent>
            </Card>
        )
    }

    const data = [
        { name: 'Protein', value: proteinCalories, color: 'hsl(var(--chart-2))' },
        { name: 'Carbs', value: carbsCalories, color: 'hsl(var(--chart-3))' },
        { name: 'Fat', value: fatCalories, color: 'hsl(var(--chart-4))' },
    ];
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Macronutrient Distribution</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={false}
                            outerRadius={80}
                            innerRadius={50}
                            paddingAngle={2}
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
                                borderRadius: 'var(--radius)',
                            }}
                            formatter={(value: number) => `${Math.round(value)} kcal`}
                        />
                    </PieChart>
                </ResponsiveContainer>
                <div className="space-y-4">
                    {data.map(item => {
                        const percentage = totalMacroCalories > 0 ? (item.value / totalMacroCalories) * 100 : 0;
                        return (
                            <div key={item.name} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span>{item.name}</span>
                                </div>
                                <span className="font-semibold">{percentage.toFixed(0)}%</span>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    );
};

const MealSections: FC<{
  meals: Record<MealType, LoggedFoodItem[]>; 
  onAddFoodClick: (mealType: MealType) => void; 
  onEditFoodClick: (food: LoggedFoodItem) => void; 
  onDeleteFoodClick: (logId: string) => void;
}> = ({meals, onAddFoodClick, onEditFoodClick, onDeleteFoodClick}) => {
    
    const mealOrder: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

    const getMealIcon = (mealType: MealType) => {
        switch(mealType) {
            case 'Breakfast': return '🍳';
            case 'Lunch': return '🥗';
            case 'Dinner': return '🍽️';
            case 'Snacks': return '🍪';
            default: return '🍽️';
        }
    };

    const totalMealsCount = Object.values(meals).flat().length;

    return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Today's Meals</h2>
            {totalMealsCount > 0 && 
              <Badge variant="outline" className="px-3 py-1">
                {totalMealsCount} {totalMealsCount === 1 ? 'item' : 'items'}
              </Badge>
            }
          </div>
          
          <Accordion type="multiple" defaultValue={mealOrder} className="space-y-3">
            {mealOrder.map(mealType => {
                const loggedItems = meals[mealType] || [];
                const totalCalories = loggedItems.reduce((acc, log) => acc + log.calories, 0);
                
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
                                        loggedItems.map(log => (
                                            <LoggedFoodItemComponent
                                              key={log.logId} 
                                              loggedFood={log} 
                                              onEdit={onEditFoodClick} 
                                              onDelete={onDeleteFoodClick} 
                                            />
                                        ))
                                    ) : (
                                        <div className="py-8 text-center border border-dashed rounded-lg">
                                            <UtensilsCrossed className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
                                            <p className="text-sm text-muted-foreground">No food logged for {mealType}.</p>
                                        </div>
                                    )}
                                    <div className="flex justify-end pt-2">
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            onClick={() => onAddFoodClick(mealType)}
                                            className="text-muted-foreground hover:text-foreground gap-2"
                                        >
                                            <Plus className="h-4 w-4"/> Add Food
                                        </Button>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Card>
                )
            })}
        </Accordion>
      </div>
    );
};

const LoggedFoodItemComponent: FC<{
  loggedFood: LoggedFoodItem; 
  onEdit: (food: LoggedFoodItem) => void; 
  onDelete: (logId: string) => void;
}> = ({loggedFood, onEdit, onDelete}) => {

    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group">
            <div className="flex-grow min-w-0">
                <p className="font-semibold truncate">{loggedFood.name}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{loggedFood.quantity}g</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="flex items-center gap-1">
                        <Beef className="h-3 w-3 text-red-500" />
                        {loggedFood.protein.toFixed(0)}g
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                        <Wheat className="h-3 w-3 text-yellow-600" />
                        {loggedFood.carbs.toFixed(0)}g
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                        <Droplets className="h-3 w-3 text-blue-500" />
                        {loggedFood.fat.toFixed(0)}g
                    </span>
                </div>
            </div>
            
            <div className="flex items-center justify-between sm:justify-end gap-4">
                <p className="font-medium text-sm sm:text-base">{Math.round(loggedFood.calories)} kcal</p>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(loggedFood)}>
                        <Pencil className="h-4 w-4"/>
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                        </AlertDialogTrigger>
                         <AlertDialogContent className="sm:max-w-md w-[95vw] rounded-lg">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Remove {loggedFood.name}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will remove this item from your meal log.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(loggedFood.logId)} className="bg-destructive hover:bg-destructive/90">
                                    Remove
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </div>
    );
};

const WaterTracker: FC<{intake: number; setIntake: (intake: number) => void; goal: number}> = ({intake, setIntake, goal}) => {
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
                        <Minus className="h-4 w-4"/>
                    </Button>
                    
                    <div className="text-center">
                        <span className="text-4xl font-bold">{intake}</span>
                        <span className="text-muted-foreground ml-2">/ {goal}</span>
                        <span className="text-muted-foreground text-sm ml-1">glasses</span>
                    </div>
                    
                    <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => setIntake(intake + 1)}
                        className="h-10 w-10 rounded-full"
                    >
                        <Plus className="h-4 w-4"/>
                    </Button>
                </div>
                
                <Progress value={(intake / goal) * 100} className="h-2 [&>div]:bg-blue-500" />
            </CardContent>
        </Card>
    );
};

const MicroNutrientGrid: FC<{ totals: DailyLog }> = ({ totals }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">Micronutrient Overview</CardTitle>
    </CardHeader>
    <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <MicroStat label="Fiber" value={totals.totalFiber} unit="g" />
      <MicroStat label="Sugar" value={totals.totalSugar} unit="g" />
      <MicroStat label="Sodium" value={totals.totalSodium} unit="mg" />
      <MicroStat label="Calcium" value={totals.totalCalcium} unit="mg" />
      <MicroStat label="Iron" value={totals.totalIron} unit="mg" />
      <MicroStat label="Vit. A" value={totals.totalVitaminA} unit="µg" />
    </CardContent>
  </Card>
);

const MicroStat: FC<{label:string, value:number, unit:string}> = ({ label, value, unit }) => (
  <div className="p-2 bg-muted/50 rounded-lg text-center">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-base font-bold">{Math.round(value)}{unit}</p>
  </div>
);
