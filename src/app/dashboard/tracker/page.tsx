
"use client";

import { useState, useMemo, type FC, type ReactNode } from "react";
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
import {
  mockTrackerData,
  userGoals,
  type LoggedFood,
} from "@/lib/tracker-data";
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
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { EmptyState } from "@/components/shared/empty-state";
import { AddFoodModal } from "@/components/tracker/add-food-modal";
import { EditFoodModal } from "@/components/tracker/edit-food-modal";
import { useToast } from "@/hooks/use-toast";

type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snacks";

// Helper function to calculate nutrient values based on quantity
const calculateNutrients = (food: Food, quantity: number) => {
  const ratio = quantity / 100; // Base nutrients are per 100g
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

  const caloriesRemaining = userGoals.calories - dailyTotals.calories;

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
      title: "Food Added!",
      description: `${food.name} added to ${mealType}.`,
    });
  };

  const handleUpdateFood = (logId: string, newQuantity: number) => {
    setLoggedFoods(prev => prev.map(log => log.logId === logId ? {...log, quantity: newQuantity} : log));
    toast({
        title: "Portion Updated!",
        description: `The portion has been updated successfully.`,
    });
  };

  const handleDeleteFood = (logId: string) => {
    setLoggedFoods((prev) => prev.filter((log) => log.logId !== logId));
    toast({
        variant: "destructive",
        title: "Food Removed!",
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
      title: "Day Cleared",
      description: "Your log for this day has been reset.",
    });
  };

  if (loggedFoods.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardX className="h-16 w-16 text-muted-foreground" />}
        title="No meals added today."
        description="Start tracking your intake to see your progress."
      >
        <Button onClick={() => openAddModal('Breakfast')}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Your First Meal
        </Button>
         <AddFoodModal
            isOpen={isAddModalOpen}
            onClose={() => setAddModalOpen(false)}
            onAddFood={handleAddFood}
            mealType={mealToAdd}
        />
      </EmptyState>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold">Daily Tracker</h1>
            <p className="text-muted-foreground">
            {date.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            })}
            </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline">Today</Button>
          <Button variant="outline" size="icon">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" className="ml-4">
                    <Trash2 className="mr-2 h-4 w-4" /> Clear Day
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete all logged food and water for this day. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={clearDay}>Clear Day</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* 2. & 3. Daily Summary & Progress */}
      <DailySummary totals={dailyTotals} goals={userGoals} />
      
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            {/* 4. Meal Sections */}
            <MealSections meals={meals} onAddFoodClick={openAddModal} onEditFoodClick={openEditModal} onDeleteFoodClick={handleDeleteFood} />
        </div>
        <div className="lg:col-span-1 space-y-6">
            {/* 8. Water Intake */}
            <WaterTracker intake={waterIntake} setIntake={setWaterIntake} goal={userGoals.water} />

            {/* 9. Macro Distribution */}
            <MacroChart data={dailyTotals} />
        </div>
      </div>
      
      {/* 6. & 7. Modals */}
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

const DailySummary: FC<{totals: any; goals: any}> = ({totals, goals}) => {
    const calorieProgress = (totals.calories / goals.calories) * 100;
    
    return (
        <Card>
            <CardContent className="p-6 grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-center">
                <div className="flex justify-center items-center">
                    <ResponsiveContainer width="100%" height={150}>
                        <PieChart>
                            <Pie
                                data={[{value: totals.calories}, {value: Math.max(0, goals.calories - totals.calories)}]}
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
                            <Tooltip content={() => null} />
                            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-3xl font-bold fill-foreground">
                                {Math.round(totals.calories)}
                            </text>
                             <text x="50%" y="65%" textAnchor="middle" dominantBaseline="middle" className="text-sm fill-muted-foreground">
                                kcal
                            </text>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                 <div className="space-y-4">
                    <SummaryItem label="Calories Remaining" value={`${Math.round(Math.max(0, goals.calories - totals.calories))} kcal`} />
                    <SummaryItem label="Goal" value={`${goals.calories} kcal`} />
                </div>
                <div className="space-y-4">
                    <SummaryItem label="Protein" value={`${totals.protein.toFixed(1)}g / ${goals.protein}g`} progress={(totals.protein / goals.protein) * 100} />
                     <SummaryItem label="Carbs" value={`${totals.carbs.toFixed(1)}g / ${goals.carbs}g`} progress={(totals.carbs / goals.carbs) * 100} />
                </div>
                 <div className="space-y-4">
                    <SummaryItem label="Fat" value={`${totals.fat.toFixed(1)}g / ${goals.fat}g`} progress={(totals.fat / goals.fat) * 100} />
                </div>
            </CardContent>
        </Card>
    );
};

const SummaryItem: FC<{label: string; value: string; progress?: number}> = ({label, value, progress}) => (
    <div>
        <div className="flex justify-between items-center mb-1">
            <p className="text-sm font-medium">{label}</p>
            <p className="text-sm text-muted-foreground">{value}</p>
        </div>
        {progress !== undefined && <Progress value={progress} className="h-2" />}
    </div>
);

const MealSections: FC<{meals: Record<MealType, LoggedFood[]>; onAddFoodClick: (mealType: MealType) => void; onEditFoodClick: (food: LoggedFood) => void; onDeleteFoodClick: (logId: string) => void;}> = ({meals, onAddFoodClick, onEditFoodClick, onDeleteFoodClick}) => {
    
    const mealOrder: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

    return (
        <Accordion type="multiple" defaultValue={mealOrder} className="w-full space-y-4">
            {mealOrder.map(mealType => {
                const loggedItems = meals[mealType];
                const totalCalories = loggedItems.reduce((acc, log) => {
                    const food = mockFoods.find(f => f.id === log.foodId);
                    return acc + (food ? calculateNutrients(food, log.quantity).calories : 0);
                }, 0);
                
                return (
                    <Card key={mealType}>
                        <AccordionItem value={mealType} className="border-b-0">
                            <AccordionTrigger className="p-4 hover:no-underline">
                                <div className="flex justify-between w-full items-center">
                                    <h3 className="text-lg font-semibold">{mealType}</h3>
                                    <div className="flex items-center gap-4">
                                        <span className="text-muted-foreground">{Math.round(totalCalories)} kcal</span>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-4 pt-0">
                                <div className="space-y-2">
                                    {loggedItems.length > 0 ? (
                                        loggedItems.map(log => (
                                            <LoggedFoodItem key={log.logId} loggedFood={log} onEdit={onEditFoodClick} onDelete={onDeleteFoodClick} />
                                        ))
                                    ) : (
                                        <p className="text-sm text-center text-muted-foreground py-4">No food logged for {mealType}.</p>
                                    )}
                                     <div className="flex justify-end pt-2">
                                        <Button size="sm" variant="ghost" onClick={() => onAddFoodClick(mealType)}>
                                            <Plus className="h-4 w-4 mr-2"/> Add Food
                                        </Button>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Card>
                )
            })}
        </Accordion>
    );
};

const LoggedFoodItem: FC<{loggedFood: LoggedFood; onEdit: (food: LoggedFood) => void; onDelete: (logId: string) => void;}> = ({loggedFood, onEdit, onDelete}) => {
    const food = mockFoods.find(f => f.id === loggedFood.foodId);
    if (!food) return null;
    const nutrients = calculateNutrients(food, loggedFood.quantity);

    return (
        <div className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50">
            <Image src={food.image} alt={food.name} width={60} height={60} className="rounded-md object-cover" data-ai-hint={food.imageHint} />
            <div className="flex-grow">
                <p className="font-semibold">{food.name}</p>
                <p className="text-sm text-muted-foreground">{loggedFood.quantity}g</p>
            </div>
            <div className="text-right">
                <p className="font-medium">{Math.round(nutrients.calories)} kcal</p>
                <p className="text-xs text-muted-foreground">
                    {nutrients.protein.toFixed(0)}p, {nutrients.carbs.toFixed(0)}c, {nutrients.fat.toFixed(0)}f
                </p>
            </div>
            <div className="flex gap-1">
                 <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(loggedFood)}>
                    <Pencil className="h-4 w-4"/>
                </Button>
                 <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(loggedFood.logId)}>
                    <Trash2 className="h-4 w-4"/>
                </Button>
            </div>
        </div>
    );
};

const WaterTracker: FC<{intake: number; setIntake: (intake: number) => void; goal: number}> = ({intake, setIntake, goal}) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Water Intake</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center mb-4">
                    <Button variant="outline" size="icon" onClick={() => setIntake(Math.max(0, intake - 1))}><Minus/></Button>
                    <div className="flex items-end gap-2">
                        <GlassWater className="h-10 w-10 text-blue-500"/>
                        <p className="text-3xl font-bold">{intake}</p>
                        <p className="text-muted-foreground">/ {goal} glasses</p>
                    </div>
                    <Button variant="outline" size="icon" onClick={() => setIntake(intake + 1)}><Plus/></Button>
                </div>
                <div className="flex gap-2 justify-center">
                    {Array.from({length: goal}).map((_, i) => (
                        <GlassWater key={i} className={cn("h-6 w-6", i < intake ? "text-blue-500 fill-blue-500/20" : "text-muted/50")}/>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

const MacroChart: FC<{data: any}> = ({data}) => {
    const { protein, carbs, fat } = data;
    const totalMacros = protein + carbs + fat;

    if(totalMacros === 0) return null;

    const chartData = [
        {name: "Protein", value: protein, color: "hsl(var(--chart-2))"},
        {name: "Carbs", value: carbs, color: "hsl(var(--chart-3))"},
        {name: "Fat", value: fat, color: "hsl(var(--chart-4))"},
    ];

    return (
        <Card>
            <CardHeader><CardTitle>Macro Distribution</CardTitle></CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                         <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                            {chartData.map((entry) => (
                                <Cell key={entry.name} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                        <Legend iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};
