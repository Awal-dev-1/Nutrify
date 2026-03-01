
"use client";

import { useState, useMemo, type FC, useEffect } from "react";
import Image from "next/image";
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
import { mockFoods, type Food } from "@/lib/data";
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
  MoreVertical,
  Loader2,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { EmptyState } from "@/components/shared/empty-state";
import { AddFoodModal } from "@/components/tracker/add-food-modal";
import { EditFoodModal } from "@/components/tracker/edit-food-modal";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDoc, useUser, useFirestore, useMemoFirebase } from "@/firebase";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { format, subDays, addDays } from "date-fns";
import type { DailyLog, LoggedFoodItem } from "@/types/analytics";


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
  
  const { data: dailyLog, isLoading: isLogLoading, error: logError } = useDoc<DailyLog>(dailyLogRef);

  const [waterIntake, setWaterIntake] = useState(0);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [mealToAdd, setMealToAdd] = useState<MealType | null>(null);
  const [editingFood, setEditingFood] = useState<LoggedFoodItem | null>(null);
  
  const userGoals = userProfile?.goals || { dailyCalorieGoal: 2000, proteinPercentageGoal: 30, carbsPercentageGoal: 40, fatPercentageGoal: 30 };
  const derivedGoals = {
    calories: userGoals.dailyCalorieGoal,
    protein: (userGoals.dailyCalorieGoal * (userGoals.proteinPercentageGoal / 100)) / 4,
    carbs: (userGoals.dailyCalorieGoal * (userGoals.carbsPercentageGoal / 100)) / 4,
    fat: (userGoals.dailyCalorieGoal * (userGoals.fatPercentageGoal / 100)) / 9,
    water: 8,
  };

  useEffect(() => {
    if (dailyLog) {
      setWaterIntake(dailyLog.waterIntake || 0);
    } else {
      setWaterIntake(0);
    }
  }, [dailyLog]);

  const meals = useMemo(() => {
    return dailyLog?.meals || { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] };
  }, [dailyLog]);
  
  const loggedFoods = useMemo(() => Object.values(meals).flat(), [meals]);

  const dailyTotals = dailyLog || { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 };


  const updateDailyLog = async (updatedMeals: Record<MealType, LoggedFoodItem[]>, water: number) => {
    if (!dailyLogRef) return;
    
    const totals = Object.values(updatedMeals).flat().reduce((acc, item) => {
        acc.totalCalories += item.calories;
        acc.totalProtein += item.protein;
        acc.totalCarbs += item.carbs;
        acc.totalFat += item.fat;
        return acc;
    }, { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 });

    const newLog: DailyLog = {
      date: dateKey,
      meals: updatedMeals,
      waterIntake: water,
      ...totals
    };

    await setDoc(dailyLogRef, newLog, { merge: true });
  };
  
  const handleAddFood = (food: Food, quantity: number, mealType: MealType) => {
    const ratio = quantity / 100;
    const newLogItem: LoggedFoodItem = {
      logId: `${Date.now()}`,
      foodId: food.id,
      name: food.name,
      imageUrl: food.image,
      quantity,
      calories: food.calories * ratio,
      protein: food.protein * ratio,
      carbs: food.carbs * ratio,
      fat: food.fat * ratio,
    };
    
    const newMeals = { ...meals, [mealType]: [...meals[mealType], newLogItem] };
    updateDailyLog(newMeals, waterIntake);
    
    toast({
      title: "Food Added!",
      description: `${food.name} added to ${mealType}.`,
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
            const foodInfo = mockFoods.find(f => f.id === originalItem.foodId);
            if(foodInfo){
                foodName = foodInfo.name;
                const ratio = newQuantity / 100;
                newMeals[mealKey][itemIndex] = {
                    ...originalItem,
                    quantity: newQuantity,
                    calories: foodInfo.calories * ratio,
                    protein: foodInfo.protein * ratio,
                    carbs: foodInfo.carbs * ratio,
                    fat: foodInfo.fat * ratio,
                };
            }
            break;
        }
    }

    updateDailyLog(newMeals, waterIntake);
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
    updateDailyLog(newMeals, waterIntake);
    toast({
        variant: "destructive",
        title: "Food Removed!",
        description: `${foodName} has been removed from your log.`,
    });
  };

  const handleWaterChange = (newIntake: number) => {
    setWaterIntake(newIntake);
    updateDailyLog(meals, newIntake);
  }

  const openAddModal = (mealType: MealType) => {
    setMealToAdd(mealType);
    setAddModalOpen(true);
  };
  
  const openEditModal = (food: LoggedFoodItem) => {
    setEditingFood(food);
  };

  const clearDay = () => {
    if(dailyLogRef) {
        setDoc(dailyLogRef, {
            date: dateKey,
            meals: { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] },
            waterIntake: 0,
            totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0
        }, { merge: false }); // Overwrite the document
    }
    toast({
      title: "Day Cleared",
      description: "Your log for this day has been reset.",
    });
  };

  if (isLogLoading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
  }

  if (loggedFoods.length === 0) {
    return (
      <div className="space-y-8">
        <Header onClearDay={clearDay} date={date} setDate={setDate} />
        <EmptyState
          icon={<ClipboardX className="h-16 w-16 text-muted-foreground" />}
          title="No meals logged today"
          description="Start tracking your intake to see your progress and meet your goals."
          className="border-2 border-dashed rounded-2xl py-16"
        >
          <Button onClick={() => openAddModal('Breakfast')} size="lg" className="mt-4">
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

      <DailySummary totals={dailyTotals} goals={derivedGoals} />
      
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
          <WaterTracker intake={waterIntake} setIntake={handleWaterChange} goal={derivedGoals.water} />
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
              <span className={cn("inline-block w-2 h-2 rounded-full", isToday ? "bg-green-500" : "bg-primary")}></span>
              <span>
              {format(date, "EEEE, MMMM d")}
              </span>
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
                Clear today's data?
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

const DailySummary: FC<{totals: any; goals: any}> = ({totals, goals}) => {
  const calorieProgress = (totals.totalCalories / goals.calories) * 100;
  const remainingCalories = Math.max(0, goals.calories - totals.totalCalories);
  const proteinProgress = (totals.totalProtein / goals.protein) * 100;
  const carbsProgress = (totals.totalCarbs / goals.carbs) * 100;
  const fatProgress = (totals.totalFat / goals.fat) * 100;
  
  return (
    <Card className="overflow-hidden border-0 shadow-md">
      <CardContent className="hidden md:grid md:grid-cols-3 divide-x p-0">
          {/* Calories Ring */}
          <div className="p-6 flex items-center justify-center">
            <div className="relative w-40 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { value: totals.totalCalories },
                      { value: remainingCalories }
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
                <span className="text-3xl font-bold">{Math.round(totals.totalCalories)}</span>
                <span className="text-xs text-muted-foreground">of {goals.calories}</span>
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
                <p className="text-2xl font-bold">{Math.round(remainingCalories)} kcal</p>
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
              <p className="text-sm font-medium">{Math.round(totals.totalProtein)}g</p>
              <p className="text-xs text-muted-foreground">Protein</p>
              <Progress value={proteinProgress} className="h-1 mt-2 [&>div]:bg-red-500" />
            </div>
            <div className="text-center">
              <div className="inline-flex p-2 rounded-full bg-yellow-50 dark:bg-yellow-950/20 mb-2">
                <Wheat className="h-4 w-4 text-yellow-600" />
              </div>
              <p className="text-sm font-medium">{Math.round(totals.totalCarbs)}g</p>
              <p className="text-xs text-muted-foreground">Carbs</p>
              <Progress value={carbsProgress} className="h-1 mt-2 [&>div]:bg-yellow-600" />
            </div>
            <div className="text-center">
              <div className="inline-flex p-2 rounded-full bg-blue-50 dark:bg-blue-950/20 mb-2">
                <Droplets className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-sm font-medium">{Math.round(totals.totalFat)}g</p>
              <p className="text-xs text-muted-foreground">Fat</p>
              <Progress value={fatProgress} className="h-1 mt-2 [&>div]:bg-blue-500" />
            </div>
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
            <Badge variant="outline" className="px-3 py-1">
              {totalMealsCount} {totalMealsCount === 1 ? 'item' : 'items'}
            </Badge>
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
            <div className="flex items-center gap-3 flex-1">
                 <div className="relative h-12 w-12 rounded-md overflow-hidden flex-shrink-0">
                    <Image 
                        src={loggedFood.imageUrl} 
                        alt={loggedFood.name} 
                        fill
                        className="object-cover"
                    />
                </div>
                <div className="flex-grow min-w-0">
                    <p className="font-semibold truncate">{loggedFood.name}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{loggedFood.quantity}g</span>
                        <span>•</span>
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
                                <AlertDialogAction onClick={() => onDelete(loggedFood.logId)}>
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
                        <Minus className="h-4 w-4"/>
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
                        <Plus className="h-4 w-4"/>
                    </Button>
                </div>
                
                <Progress value={percentage} className="h-2 [&>div]:bg-blue-500" />
            </CardContent>
        </Card>
    );
};

const MacroChart: FC<{data: any}> = ({data}) => {
    const { totalProtein, totalCarbs, totalFat } = data;
    const totalMacros = totalProtein + totalCarbs + totalFat;

    if(totalMacros === 0) {
        return (
            <Card className="overflow-hidden border shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Macro Distribution</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[250px]">
                    <div className="text-center">
                        <PieChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">Log meals to see distribution</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const chartData = [
        {name: "Protein", value: totalProtein, color: "hsl(var(--chart-2))"},
        {name: "Carbs", value: totalCarbs, color: "hsl(var(--chart-3))"},
        {name: "Fat", value: totalFat, color: "hsl(var(--chart-4))"},
    ];

    return (
        <Card className="overflow-hidden border shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
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
                            label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
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
                                padding: '8px 12px'
                            }} 
                            formatter={(value: number) => [`${value.toFixed(0)}g`, '']}
                        />
                    </PieChart>
                </ResponsiveContainer>
                
                <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
                        <p className="text-xs text-muted-foreground">Protein</p>
                        <p className="text-sm font-bold">{totalProtein.toFixed(0)}g</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                        <p className="text-xs text-muted-foreground">Carbs</p>
                        <p className="text-sm font-bold">{totalCarbs.toFixed(0)}g</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                        <p className="text-xs text-muted-foreground">Fat</p>
                        <p className="text-sm font-bold">{totalFat.toFixed(0)}g</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
