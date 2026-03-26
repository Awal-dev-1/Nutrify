
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
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from 'framer-motion';
import { MICRONUTRIENT_KEYS, NUTRIENT_LABELS, NUTRIENT_UNITS, MicronutrientKey } from "@/lib/nutrients";

type MealType = "Breakfast" | "Lunch" | "Dinner";

export default function DailyTrackerPage() {
  const { toast } = useToast();
  const { user, userProfile } = useUser();
  const db = useFirestore();
  const [date, setDate] = useState(new Date());

  const dateKey = format(date, "yyyy-MM-dd");
  const dailyLogRef = useMemoFirebase(
    () => (user ? doc(db, "users", user.uid, "dailyLogs", dateKey) : null),
    [user, db, dateKey]
  );

  const { data: dailyLog, isLoading: isLogLoading } = useDoc<DailyLog>(dailyLogRef);

  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [mealToAdd, setMealToAdd] = useState<MealType | null>(null);
  const [editingFood, setEditingFood] = useState<Pick<LoggedFoodItem, "logId" | "quantity"> | null>(null);

  const userGoals = userProfile?.goals || { dailyCalorieGoal: 2000, proteinPercentageGoal: 30, carbsPercentageGoal: 40, fatPercentageGoal: 30 };
  const derivedGoals = {
    calories: userGoals.dailyCalorieGoal,
    protein: (userGoals.dailyCalorieGoal * (userGoals.proteinPercentageGoal / 100)) / 4,
    carbs: (userGoals.dailyCalorieGoal * (userGoals.carbsPercentageGoal / 100)) / 4,
    fat: (userGoals.dailyCalorieGoal * (userGoals.fatPercentageGoal / 100)) / 9,
    water: 8,
  };

  const meals = useMemo(() => {
    return dailyLog?.meals || { Breakfast: [], Lunch: [], Dinner: [] };
  }, [dailyLog]);

  const dailyTotals = useMemo(() => {
    return dailyLog || {
      totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0,
      totalIron: 0, totalVitaminA: 0, totalSodium: 0, totalFiber: 0,
      totalSugar: 0, totalCalcium: 0, totalVitaminC: 0, totalVitaminD: 0,
      totalVitaminE: 0, totalVitaminK: 0, totalVitaminB1: 0, totalVitaminB2: 0,
      totalVitaminB3: 0, totalVitaminB6: 0, totalVitaminB12: 0, totalFolate: 0,
      totalMagnesium: 0, totalPotassium: 0, totalZinc: 0,
      waterIntake: 0,
    };
  }, [dailyLog]);

  const updateDailyLog = (updatedMeals: Record<MealType, LoggedFoodItem[]>, water: number) => {
    if (!dailyLogRef) return;
    const allMeals = Object.values(updatedMeals).flat();
    
    const calculateTotal = (key: keyof Omit<LoggedFoodItem, 'logId' | 'foodId' | 'name' | 'quantity'>) => 
        allMeals.reduce((sum, item) => sum + (item[key] || 0), 0);

    const newTotals: Omit<DailyLog, 'date' | 'meals' | 'waterIntake'> = {
        totalCalories: calculateTotal('calories'),
        totalProtein: calculateTotal('protein'),
        totalCarbs: calculateTotal('carbs'),
        totalFat: calculateTotal('fat'),
        totalFiber: calculateTotal('fiber'),
        totalSugar: calculateTotal('sugar'),
        totalSodium: calculateTotal('sodium'),
        totalCalcium: calculateTotal('calcium'),
        totalIron: calculateTotal('iron'),
        totalPotassium: calculateTotal('potassium'),
        totalMagnesium: calculateTotal('magnesium'),
        totalZinc: calculateTotal('zinc'),
        totalPhosphorus: calculateTotal('phosphorus'),
        totalIodine: calculateTotal('iodine'),
        totalSelenium: calculateTotal('selenium'),
        totalCopper: calculateTotal('copper'),
        totalManganese: calculateTotal('manganese'),
        totalChromium: calculateTotal('chromium'),
        totalMolybdenum: calculateTotal('molybdenum'),
        totalChloride: calculateTotal('chloride'),
        totalVitaminA: calculateTotal('vitaminA'),
        totalVitaminC: calculateTotal('vitaminC'),
        totalVitaminD: calculateTotal('vitaminD'),
        totalVitaminE: calculateTotal('vitaminE'),
        totalVitaminK: calculateTotal('vitaminK'),
        totalVitaminB1: calculateTotal('vitaminB1'),
        totalVitaminB2: calculateTotal('vitaminB2'),
        totalVitaminB3: calculateTotal('vitaminB3'),
        totalVitaminB5: calculateTotal('vitaminB5'),
        totalVitaminB6: calculateTotal('vitaminB6'),
        totalVitaminB7: calculateTotal('vitaminB7'),
        totalFolate: calculateTotal('folate'),
        totalVitaminB12: calculateTotal('vitaminB12'),
    };

    const newLog: DailyLog = { date: dateKey, meals: updatedMeals, waterIntake: water, ...newTotals };
    setDoc(dailyLogRef, newLog, { merge: true }).catch((error) => {
      errorEmitter.emit("permission-error", new FirestorePermissionError({ path: dailyLogRef.path, operation: "write", requestResourceData: newLog }));
    });
  };

  const handleAddFood = (foodData: AiFoodItem, quantity: number, mealType: MealType) => {
    if (!db) return;
    const ratio = quantity / 100;
    const newLogItem: LoggedFoodItem = {
      logId: doc(collection(db, "temp")).id,
      foodId: foodData.foodName,
      name: foodData.foodName,
      quantity,
      calories: (foodData.calories || 0) * ratio,
      protein: (foodData.macronutrientBreakdown.protein || 0) * ratio,
      carbs: (foodData.macronutrientBreakdown.carbohydrates || 0) * ratio,
      fat: (foodData.macronutrientBreakdown.fat || 0) * ratio,
      fiber: (foodData.micronutrientBreakdown?.fiber || 0) * ratio,
      sugar: (foodData.micronutrientBreakdown?.sugar || 0) * ratio,
      sodium: (foodData.micronutrientBreakdown?.sodium || 0) * ratio,
      calcium: (foodData.micronutrientBreakdown?.calcium || 0) * ratio,
      iron: (foodData.micronutrientBreakdown?.iron || 0) * ratio,
      potassium: (foodData.micronutrientBreakdown?.potassium || 0) * ratio,
      magnesium: (foodData.micronutrientBreakdown?.magnesium || 0) * ratio,
      zinc: (foodData.micronutrientBreakdown?.zinc || 0) * ratio,
      phosphorus: (foodData.micronutrientBreakdown?.phosphorus || 0) * ratio,
      iodine: (foodData.micronutrientBreakdown?.iodine || 0) * ratio,
      selenium: (foodData.micronutrientBreakdown?.selenium || 0) * ratio,
      copper: (foodData.micronutrientBreakdown?.copper || 0) * ratio,
      manganese: (foodData.micronutrientBreakdown?.manganese || 0) * ratio,
      chromium: (foodData.micronutrientBreakdown?.chromium || 0) * ratio,
      molybdenum: (foodData.micronutrientBreakdown?.molybdenum || 0) * ratio,
      chloride: (foodData.micronutrientBreakdown?.chloride || 0) * ratio,
      vitaminA: (foodData.micronutrientBreakdown?.vitaminA || 0) * ratio,
      vitaminC: (foodData.micronutrientBreakdown?.vitaminC || 0) * ratio,
      vitaminD: (foodData.micronutrientBreakdown?.vitaminD || 0) * ratio,
      vitaminE: (foodData.micronutrientBreakdown?.vitaminE || 0) * ratio,
      vitaminK: (foodData.micronutrientBreakdown?.vitaminK || 0) * ratio,
      vitaminB1: (foodData.micronutrientBreakdown?.vitaminB1 || 0) * ratio,
      vitaminB2: (foodData.micronutrientBreakdown?.vitaminB2 || 0) * ratio,
      vitaminB3: (foodData.micronutrientBreakdown?.vitaminB3 || 0) * ratio,
      vitaminB5: (foodData.micronutrientBreakdown?.vitaminB5 || 0) * ratio,
      vitaminB6: (foodData.micronutrientBreakdown?.vitaminB6 || 0) * ratio,
      vitaminB7: (foodData.micronutrientBreakdown?.vitaminB7 || 0) * ratio,
      folate: (foodData.micronutrientBreakdown?.folate || 0) * ratio,
      vitaminB12: (foodData.micronutrientBreakdown?.vitaminB12 || 0) * ratio,
    };
    const newMeals = { ...meals, [mealType]: [...(meals[mealType] || []), newLogItem] };
    updateDailyLog(newMeals, dailyTotals.waterIntake);
    toast({ title: "Food Added!", description: `${foodData.foodName} added to ${mealType}.` });
  };

  const handleUpdateFood = (logId: string, newQuantity: number) => {
    const newMeals = { ...meals };
    let foodName = "";
    for (const mealType in newMeals) {
      const mealKey = mealType as MealType;
      const itemIndex = newMeals[mealKey].findIndex((item) => item.logId === logId);
      if (itemIndex > -1) {
        const originalItem = newMeals[mealKey][itemIndex];
        foodName = originalItem.name;
        const originalQuantity = originalItem.quantity;
        if (originalQuantity > 0) {
          const ratio = newQuantity / originalQuantity;
          const updatedItem = { ...originalItem, quantity: newQuantity };
          const nutrientKeys: (keyof LoggedFoodItem)[] = [
            'calories', 'protein', 'carbs', 'fat', 'iron', 'vitaminA', 'sodium', 
            'fiber', 'sugar', 'calcium', 'vitaminC', 'vitaminD', 'vitaminE', 
            'vitaminK', 'vitaminB1', 'vitaminB2', 'vitaminB3', 'vitaminB5', 'vitaminB6', 
            'vitaminB7', 'folate', 'magnesium', 'potassium', 'zinc', 'phosphorus',
            'iodine', 'selenium', 'copper', 'manganese', 'chromium', 'molybdenum', 'chloride', 'vitaminB12'
          ];
          nutrientKeys.forEach(key => {
            if (typeof updatedItem[key] === 'number') {
              (updatedItem as any)[key] = (originalItem[key] as number) * ratio;
            }
          });
          newMeals[mealKey][itemIndex] = updatedItem;
        }
        break;
      }
    }
    updateDailyLog(newMeals, dailyTotals.waterIntake);
    toast({ title: "Portion Updated!", description: `The portion for ${foodName} has been updated.` });
  };

  const handleDeleteFood = (logId: string) => {
    const newMeals = { ...meals };
    let foodName = "";
    for (const mealType in newMeals) {
      const mealKey = mealType as MealType;
      const originalLength = newMeals[mealKey].length;
      newMeals[mealKey] = newMeals[mealKey].filter((item) => {
        if (item.logId === logId) { foodName = item.name; return false; }
        return true;
      });
      if (newMeals[mealKey].length < originalLength) break;
    }
    updateDailyLog(newMeals, dailyTotals.waterIntake);
    toast({ variant: "destructive", title: "Food Removed!", description: `${foodName} has been removed from your log.` });
  };

  const handleWaterChange = (newIntake: number) => updateDailyLog(meals, newIntake);
  const openAddModal = (mealType: MealType) => { setMealToAdd(mealType); setAddModalOpen(true); };
  const openEditModal = (food: LoggedFoodItem) => setEditingFood({ logId: food.logId, quantity: food.quantity });

  const clearDay = () => {
    if (dailyLogRef) {
      const emptyLog: DailyLog = {
        date: dateKey, meals: { Breakfast: [], Lunch: [], Dinner: [] },
        waterIntake: 0, totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0,
        totalIron: 0, totalVitaminA: 0, totalSodium: 0, totalFiber: 0,
        totalSugar: 0, totalCalcium: 0, totalVitaminC: 0, totalVitaminD: 0,
        totalVitaminE: 0, totalVitaminK: 0, totalVitaminB1: 0, totalVitaminB2: 0,
        totalVitaminB3: 0, totalVitaminB6: 0, totalVitaminB12: 0, totalFolate: 0,
        totalMagnesium: 0, totalPotassium: 0, totalZinc: 0, totalPhosphorus: 0,
        totalIodine: 0, totalSelenium: 0, totalCopper: 0, totalManganese: 0,
        totalChromium: 0, totalMolybdenum: 0, totalChloride: 0,
      };
      setDoc(dailyLogRef, emptyLog, { merge: false }).catch((error) => {
        errorEmitter.emit("permission-error", new FirestorePermissionError({ path: dailyLogRef.path, operation: "write", requestResourceData: emptyLog }));
      });
    }
    toast({ title: "Day Cleared", description: "Your log for this day has been reset." });
  };

  if (isLogLoading) {
    return <TrackerSkeleton />;
  }

  return (
    <div className="space-y-4 sm:space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Header onClearDay={clearDay} date={date} setDate={setDate} />
      </motion.div>

      {!dailyLog || Object.values(meals).flat().length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
        >
          <EmptyState
            icon={<ClipboardX className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />}
            title="No meals logged yet"
            description="Start tracking your nutrition by adding your first meal of the day."
          >
            <Button onClick={() => openAddModal("Breakfast")} size="lg" className="mt-4 shadow-lg hover:shadow-xl transition-shadow w-full sm:w-auto">
              <PlusCircle className="mr-2 h-5 w-5" />
              Add Your First Meal
            </Button>
          </EmptyState>
        </motion.div>
      ) : (
        // Stack on mobile, side-by-side on lg+
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          <div className="lg:col-span-2 space-y-4 sm:space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.05 }}>
              <CalorieSummaryCard totals={dailyTotals} goal={derivedGoals.calories} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.1 }}>
              <MacroPieChart totals={dailyTotals} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.15 }}>
              <MicroNutrientGrid totals={dailyTotals} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.2 }}>
              <MealSections
                meals={meals}
                onAddFoodClick={openAddModal}
                onEditFoodClick={openEditModal}
                onDeleteFoodClick={handleDeleteFood}
              />
            </motion.div>
          </div>
          {/* Water tracker: natural flow on mobile, sticky on lg+ */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <WaterTracker intake={dailyTotals.waterIntake} setIntake={handleWaterChange} goal={derivedGoals.water} />
          </motion.div>
        </div>
      )}

      <AddFoodModal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} onAddFood={handleAddFood} mealType={mealToAdd} />
      <EditFoodModal isOpen={!!editingFood} onClose={() => setEditingFood(null)} onUpdate={handleUpdateFood} loggedFood={editingFood} />
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────
const Header: FC<{ onClearDay: () => void; date: Date; setDate: (date: Date) => void }> = ({ onClearDay, date, setDate }) => {
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
      {/* Title block */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-sm shrink-0">
          <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        </div>
        <div className="min-w-0">
          <h1 className="text-h1 font-bold tracking-tight text-primary">
            Daily Tracker
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-body text-muted-foreground truncate">
              {format(date, "EEEE, MMMM d")}
            </p>
            {isToday && (
              <Badge variant="secondary" className="rounded-full px-2 sm:px-3 py-0.5 text-xs font-medium shrink-0">
                Today
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
        {/* Date nav: takes remaining space on mobile */}
        <div className="flex items-center gap-1 bg-muted/30 rounded-2xl p-1.5 border shadow-sm flex-1 sm:flex-none justify-between sm:justify-start">
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl hover:bg-background" onClick={() => setDate(subDays(date, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 sm:h-9 px-3 sm:px-4 rounded-xl text-sm font-medium hover:bg-background" onClick={() => setDate(new Date())} disabled={isToday}>
            Today
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl hover:bg-background" onClick={() => setDate(addDays(date, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Clear day */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="icon" className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all shrink-0">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                <div className="p-2 rounded-full bg-destructive/10 shrink-0">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                </div>
                Clear today's data?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm sm:text-base pt-2">
                This will permanently delete all logged meals and water intake for this day. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-0">
              <AlertDialogCancel className="rounded-xl w-full sm:w-auto mt-0">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onClearDay} className="rounded-xl w-full sm:w-auto bg-destructive hover:bg-destructive/90">
                Clear Day
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

// ── Calorie Summary ───────────────────────────────────────────────────────────
const CalorieSummaryCard: FC<{ totals: DailyLog; goal: number }> = ({ totals, goal }) => {
  const calorieProgress = Math.min((totals.totalCalories / goal) * 100, 100);
  const remainingCalories = Math.max(0, goal - totals.totalCalories);
  const isOverGoal = totals.totalCalories > goal;

  return (
    <Card className="overflow-hidden border shadow-lg">
      <CardContent className="p-4 sm:p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold">Daily Calories</h3>
          <Badge variant="outline" className={cn(
            "rounded-full px-2 sm:px-3 py-1 text-xs sm:text-sm",
            isOverGoal ? "border-destructive text-destructive" : "border-primary text-primary"
          )}>
            <Flame className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
            {Math.round(totals.totalCalories)} / {goal}
          </Badge>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div className="relative pb-6">
            <Progress value={calorieProgress} className="h-3" />
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>{Math.round(goal * 0.5)}</span>
              <span>{goal}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 rounded-xl bg-muted/30">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Consumed</p>
              <p className="text-h3 font-bold">{Math.round(totals.totalCalories)}</p>
              <p className="text-xs text-muted-foreground mt-1">kcal</p>
            </div>
            <div className="p-3 sm:p-4 rounded-xl bg-primary/5">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Remaining</p>
              <p className="text-h3 font-bold text-primary">{Math.round(remainingCalories)}</p>
              <p className="text-xs text-muted-foreground mt-1">kcal</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ── Macro Pie Chart ───────────────────────────────────────────────────────────
const MacroPieChart: FC<{ totals: DailyLog }> = ({ totals }) => {
  const proteinCalories = totals.totalProtein * 4;
  const carbsCalories = totals.totalCarbs * 4;
  const fatCalories = totals.totalFat * 9;
  const totalMacroCalories = proteinCalories + carbsCalories + fatCalories;

  if (totalMacroCalories === 0) {
    return (
      <Card className="border shadow-lg">
        <CardHeader className="pb-2"><CardTitle className="text-base sm:text-lg">Macronutrients</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center h-40 sm:h-48">
          <div className="text-center">
            <div className="inline-flex p-3 rounded-full bg-muted mb-3">
              <UtensilsCrossed className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Add a meal to see your macro breakdown</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const data = [
    { name: "Protein", value: proteinCalories, color: "hsl(var(--chart-2))" },
    { name: "Carbs", value: carbsCalories, color: "hsl(var(--chart-4))" },
    { name: "Fat", value: fatCalories, color: "hsl(var(--chart-1))" },
  ];

  return (
    <Card className="border shadow-lg">
      <CardHeader className="pb-2"><CardTitle className="text-base sm:text-lg">Macronutrient Balance</CardTitle></CardHeader>
      {/* Stack chart + legend on mobile, side-by-side on md+ */}
      <CardContent className="flex flex-col md:grid md:grid-cols-2 gap-4 sm:gap-8 items-center p-4 sm:p-6">
        <div className="h-[180px] sm:h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "12px", padding: "8px 12px" }}
                formatter={(value: number) => `${Math.round(value)} kcal`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3 w-full">
          {data.map((item) => {
            const percentage = ((item.value / totalMacroCalories) * 100).toFixed(0);
            return (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="font-medium text-sm sm:text-base">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-xs sm:text-sm text-muted-foreground">{Math.round(item.value)} kcal</span>
                  <Badge variant="secondary" className="min-w-[40px] sm:min-w-[45px] text-center text-xs">
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

// ── Meal Sections ─────────────────────────────────────────────────────────────
const MealSections: FC<{
  meals: Record<MealType, LoggedFoodItem[]>;
  onAddFoodClick: (mealType: MealType) => void;
  onEditFoodClick: (food: LoggedFoodItem) => void;
  onDeleteFoodClick: (logId: string) => void;
}> = ({ meals, onAddFoodClick, onEditFoodClick, onDeleteFoodClick }) => {
  const mealOrder: MealType[] = ["Breakfast", "Lunch", "Dinner"];

  const getMealIcon = (mealType: MealType) => {
    switch (mealType) {
      case "Breakfast": return <Coffee className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />;
      case "Lunch":     return <Sun    className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />;
      case "Dinner":    return <Moon   className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500" />;
      default:          return <UtensilsCrossed className="h-4 w-4 sm:h-5 sm:w-5" />;
    }
  };

  const totalMealsCount = Object.values(meals).flat().length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-h3 font-semibold">Today's Meals</h2>
        {totalMealsCount > 0 && (
          <Badge variant="secondary" className="rounded-full px-3 sm:px-4 py-1 text-xs sm:text-sm">
            {totalMealsCount} {totalMealsCount === 1 ? "item" : "items"}
          </Badge>
        )}
      </div>

      <Accordion type="multiple" defaultValue={mealOrder} className="space-y-3 sm:space-y-4">
        {mealOrder.map((mealType) => {
          const loggedItems = meals[mealType] || [];
          const totalCalories = loggedItems.reduce((acc, log) => acc + log.calories, 0);

          return (
            <Card key={mealType} className="overflow-hidden border shadow-lg">
              <AccordionItem value={mealType} className="border-0">
                <AccordionTrigger className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-muted/20 transition-colors">
                  <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                      <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 shrink-0">
                        {getMealIcon(mealType)}
                      </div>
                      <div className="text-left min-w-0">
                        <h3 className="font-semibold text-base sm:text-lg">{mealType}</h3>
                        {loggedItems.length > 0 && (
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {loggedItems.length} {loggedItems.length === 1 ? "item" : "items"}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm shrink-0">
                      {Math.round(totalCalories)} kcal
                    </Badge>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-2">
                  <div className="space-y-3">
                    {loggedItems.length > 0 ? (
                      loggedItems.map((log) => (
                        <LoggedFoodItemComponent key={log.logId} loggedFood={log} onEdit={onEditFoodClick} onDelete={onDeleteFoodClick} />
                      ))
                    ) : (
                      <div className="py-8 sm:py-12 text-center">
                        <div className="inline-flex p-3 sm:p-4 rounded-full bg-muted/50 mb-3">
                          <UtensilsCrossed className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground/50" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">No food logged for {mealType}</p>
                      </div>
                    )}

                    <Button size="default" variant="outline" onClick={() => onAddFoodClick(mealType)}
                      className="w-full mt-2 rounded-xl border-dashed hover:border-primary hover:text-primary transition-all">
                      <Plus className="h-4 w-4 mr-2" /> Add to {mealType}
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

// ── Logged Food Item ──────────────────────────────────────────────────────────
const LoggedFoodItemComponent: FC<{
  loggedFood: LoggedFoodItem;
  onEdit: (food: LoggedFoodItem) => void;
  onDelete: (logId: string) => void;
}> = ({ loggedFood, onEdit, onDelete }) => (
  <div className="group relative">
    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="relative p-3 sm:p-4 rounded-xl border bg-card hover:shadow-md transition-all">
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Name + macros */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
            <h4 className="font-semibold text-sm sm:text-base">{loggedFood.name}</h4>
            <Badge variant="secondary" className="rounded-full text-xs px-2 shrink-0">
              {loggedFood.quantity}g
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-1">
              <Beef className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-500" />
              <span>{loggedFood.protein.toFixed(0)}g</span>
            </div>
            <span className="text-muted-foreground/50">•</span>
            <div className="flex items-center gap-1">
              <Wheat className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-yellow-600" />
              <span>{loggedFood.carbs.toFixed(0)}g</span>
            </div>
            <span className="text-muted-foreground/50">•</span>
            <div className="flex items-center gap-1">
              <Droplets className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-500" />
              <span>{loggedFood.fat.toFixed(0)}g</span>
            </div>
          </div>
        </div>

        {/* Calories + actions */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <p className="font-bold text-primary text-sm sm:text-base">{Math.round(loggedFood.calories)}</p>
            <p className="text-xs text-muted-foreground">kcal</p>
          </div>
          {/* Always visible on mobile (touch has no hover); hover-only on pointer devices */}
          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg hover:bg-muted" onClick={() => onEdit(loggedFood)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-base sm:text-lg">Remove {loggedFood.name}?</AlertDialogTitle>
                  <AlertDialogDescription className="text-sm">This will remove this item from your meal log.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-0">
                  <AlertDialogCancel className="mt-0 w-full sm:w-auto">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(loggedFood.logId)} className="w-full sm:w-auto bg-destructive hover:bg-destructive/90">
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

// ── Water Tracker ─────────────────────────────────────────────────────────────
const WaterTracker: FC<{ intake: number; setIntake: (intake: number) => void; goal: number }> = ({ intake, setIntake, goal }) => {
  const progress = (intake / goal) * 100;
  const isGoalMet = intake >= goal;

  return (
    // sticky only on lg+ where there's enough viewport height
    <Card className="overflow-hidden border shadow-lg lg:sticky lg:top-24">
      <CardHeader className="pb-3 sm:pb-4 bg-gradient-to-br from-blue-500/5 to-transparent">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <div className="p-1.5 sm:p-2 rounded-xl bg-blue-500/10">
            <GlassWater className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
          </div>
          Water Intake
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="icon"
            onClick={() => setIntake(Math.max(0, intake - 1))}
            className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl border-2 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all"
            disabled={intake === 0}>
            <Minus className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          <div className="text-center flex-1">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl sm:text-5xl font-bold text-blue-500">{intake}</span>
              <span className="text-lg sm:text-xl text-muted-foreground">/ {goal}</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">glasses</p>
          </div>

          <Button variant="outline" size="icon"
            onClick={() => setIntake(intake + 1)}
            className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl border-2 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all">
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2.5" indicatorStyle={{ backgroundColor: "hsl(210 100% 50%)" }} />
        </div>

        {isGoalMet && (
          <div className="flex items-center gap-2 p-2.5 sm:p-3 rounded-xl bg-green-500/10 text-green-600">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="text-xs sm:text-sm font-medium">Daily water goal achieved!</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ── Micronutrient Grid ────────────────────────────────────────────────────────
const MicroNutrientGrid: FC<{ totals: DailyLog }> = ({ totals }) => {
  const micros = MICRONUTRIENT_KEYS.map(key => ({
    label: NUTRIENT_LABELS[key],
    value: totals[`total${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof DailyLog] as number,
    unit: NUTRIENT_UNITS[key],
  })).filter(m => m.value > 0);

  return (
    <Card className="border shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Salad className="h-4 w-4 text-primary" />
          Micronutrient Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        {micros.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
            {micros.map(micro => (
              <MicroStat key={micro.label} label={micro.label} value={micro.value} unit={micro.unit} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No micronutrient data logged for this day.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const MicroStat: FC<{ label: string; value: number; unit: string }> = ({ label, value, unit }) => (
  <div className="p-2 rounded-lg bg-muted/30 text-center">
    <p className="text-[10px] truncate text-muted-foreground">{label}</p>
    <p className="font-bold text-sm">
      {value.toFixed(1)}
      <span className="text-xs font-normal text-muted-foreground ml-0.5">{unit}</span>
    </p>
  </div>
);

const TrackerSkeleton = () => (
    <div className="space-y-4 sm:space-y-8 animate-pulse">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
            <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-2xl" />
                <div>
                    <Skeleton className="h-8 w-40 mb-1" />
                    <Skeleton className="h-5 w-48" />
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Skeleton className="h-11 flex-1 rounded-2xl" />
                <Skeleton className="h-11 w-11 rounded-xl" />
            </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
            <div className="lg:col-span-2 space-y-4 sm:space-y-8">
                <Skeleton className="h-48 rounded-lg" />
                <Skeleton className="h-56 rounded-lg" />
                <Skeleton className="h-48 rounded-lg" />
                <div className="space-y-4">
                    <Skeleton className="h-24 rounded-lg" />
                    <Skeleton className="h-24 rounded-lg" />
                </div>
            </div>
            <div className="lg:col-span-1">
                <Skeleton className="h-48 rounded-lg" />
            </div>
        </div>
    </div>
)
