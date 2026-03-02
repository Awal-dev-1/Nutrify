'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { updateUserGoals, type UserGoals } from '@/services/goalsService';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { Save, RefreshCw, Target, AlertCircle, Info } from 'lucide-react';
import { UserProfile } from '@/firebase/provider';

const MACRO_COLORS = {
  protein: 'hsl(var(--chart-2))',
  carbs: 'hsl(var(--chart-3))',
  fat: 'hsl(var(--chart-4))',
};

const getRecommendedGoals = (primaryGoal: string | undefined) => {
  switch (primaryGoal) {
    case 'lose-weight':
      return { protein: 35, carbs: 40, fat: 25 };
    case 'gain-weight':
      return { protein: 30, carbs: 45, fat: 25 };
    case 'eat-healthier':
      return { protein: 30, carbs: 40, fat: 30 };
    case 'maintain-weight':
    default:
      return { protein: 30, carbs: 40, fat: 30 };
  }
};


export default function GoalsPage() {
  const { user, userProfile, isProfileLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [calories, setCalories] = useState<number>(2000);
  const [macros, setMacros] = useState({ protein: 30, carbs: 40, fat: 30 });
  const [isSaving, setIsSaving] = useState(false);
  const [initialState, setInitialState] = useState<{calories: number; macros: {protein: number, carbs: number, fat: number}} | null>(null);

  useEffect(() => {
    if (userProfile?.goals) {
      const initialGoals = {
        calories: userProfile.goals.dailyCalorieGoal,
        macros: {
            protein: userProfile.goals.proteinPercentageGoal,
            carbs: userProfile.goals.carbsPercentageGoal,
            fat: userProfile.goals.fatPercentageGoal,
        }
      };
      setCalories(initialGoals.calories);
      setMacros(initialGoals.macros);
      setInitialState(initialGoals);
    }
  }, [userProfile]);

  const macroGrams = useMemo(() => {
    const proteinGrams = (calories * (macros.protein / 100)) / 4;
    const carbsGrams = (calories * (macros.carbs / 100)) / 4;
    const fatGrams = (calories * (macros.fat / 100)) / 9;
    return { protein: proteinGrams, carbs: carbsGrams, fat: fatGrams };
  }, [calories, macros]);

  const handleMacroChange = (
    changedMacro: 'protein' | 'carbs' | 'fat',
    value: number
  ) => {
    let newMacros = { ...macros };
    const oldValue = newMacros[changedMacro];
    const delta = value - oldValue;

    if (delta === 0) return;
    
    newMacros[changedMacro] = value;
    
    // Distribute the change proportionally to the other two macros
    const otherMacros = (['protein', 'carbs', 'fat'] as const).filter(m => m !== changedMacro);
    const [macroA, macroB] = otherMacros;

    const totalOther = newMacros[macroA] + newMacros[macroB];

    if (totalOther > 0) {
        let changeA = delta * (newMacros[macroA] / totalOther);
        let changeB = delta * (newMacros[macroB] / totalOther);

        newMacros[macroA] -= changeA;
        newMacros[macroB] -= changeB;
    } else {
        // If other two are zero, split the delta
        newMacros[macroA] -= delta / 2;
        newMacros[macroB] -= delta / 2;
    }

    // Clamp values between 0 and 100
    newMacros.protein = Math.max(0, Math.min(100, newMacros.protein));
    newMacros.carbs = Math.max(0, Math.min(100, newMacros.carbs));
    newMacros.fat = Math.max(0, Math.min(100, newMacros.fat));
    
    // Final adjustment to ensure it's exactly 100
    const finalTotal = newMacros.protein + newMacros.carbs + newMacros.fat;
    const finalDelta = 100 - finalTotal;
    
    // Add leftover to largest macro
    const maxMacro = Object.keys(newMacros).reduce((a, b) => newMacros[a as keyof typeof newMacros] > newMacros[b as keyof typeof newMacros] ? a : b) as keyof typeof newMacros;
    newMacros[maxMacro] += finalDelta;
    
    setMacros({
        protein: Math.round(newMacros.protein),
        carbs: Math.round(newMacros.carbs),
        fat: Math.round(newMacros.fat),
    });
  };

  const handleReset = () => {
    const recommended = getRecommendedGoals(userProfile?.health?.primaryGoal);
    setMacros(recommended);
    toast({
        title: "Goals Reset",
        description: "Your macros have been reset to our recommended values."
    })
  };

  const handleSave = () => {
    if (!user || !db) return;
    setIsSaving(true);
    
    const newGoals: UserGoals = {
      dailyCalorieGoal: calories,
      proteinPercentageGoal: macros.protein,
      carbsPercentageGoal: macros.carbs,
      fatPercentageGoal: macros.fat,
    };
    
    updateUserGoals(db, user.uid, newGoals);
    
    setInitialState({calories, macros});
    toast({
      title: 'Goals Saved!',
      description: 'Your nutritional targets have been updated.',
    });
    
    setIsSaving(false);
  };

  const hasChanges = useMemo(() => {
    if (!initialState) return false;
    if (calories !== initialState.calories) return true;
    if (macros.protein !== initialState.macros.protein || macros.carbs !== initialState.macros.carbs || macros.fat !== initialState.macros.fat) return true;
    return false;
  }, [calories, macros, initialState]);

  if (isProfileLoading) {
    return <GoalsSkeleton />;
  }

  if (!userProfile) {
    return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Could not load user profile. Please try again later.</AlertDescription>
        </Alert>
    )
  }

  const pieData = [
    { name: 'Protein', value: macros.protein, color: MACRO_COLORS.protein },
    { name: 'Carbs', value: macros.carbs, color: MACRO_COLORS.carbs },
    { name: 'Fat', value: macros.fat, color: MACRO_COLORS.fat },
  ];
  
  const goalMessage = {
      'lose-weight': "You're working toward weight loss. Consistency is key!",
      'gain-weight': "You're building muscle. Fuel your body for growth!",
      'maintain-weight': "You're maintaining a healthy weight. Great job on the balance!",
      'eat-healthier': "You're focused on healthier eating. Every choice is a step forward!",
  }[userProfile.health?.primaryGoal || 'maintain-weight'];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Target className="h-8 w-8 text-primary"/>
            Nutrition Goals
        </h1>
        <p className="text-muted-foreground mt-1">
          Customize your daily targets to match your health goals.
        </p>
         <Alert className="mt-4 bg-primary/5 border-primary/20">
          <Info className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary/90">Heads Up!</AlertTitle>
          <AlertDescription>
            {goalMessage}
          </AlertDescription>
        </Alert>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Daily Calorie Target</CardTitle>
                    <CardDescription>Set your daily energy intake goal.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Label htmlFor="calories">Daily Calories (kcal)</Label>
                    <Input 
                        id="calories"
                        type="number"
                        value={calories}
                        onChange={(e) => setCalories(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="text-lg max-w-xs"
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Macronutrient Distribution</CardTitle>
                    <CardDescription>Adjust the percentage of your daily calories from each macro.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <MacroSlider 
                        label="Protein" 
                        value={macros.protein} 
                        color={MACRO_COLORS.protein}
                        onValueChange={(v) => handleMacroChange('protein', v)}
                    />
                    <MacroSlider 
                        label="Carbohydrates" 
                        value={macros.carbs} 
                        color={MACRO_COLORS.carbs}
                        onValueChange={(v) => handleMacroChange('carbs', v)}
                    />
                    <MacroSlider 
                        label="Fat" 
                        value={macros.fat} 
                        color={MACRO_COLORS.fat}
                        onValueChange={(v) => handleMacroChange('fat', v)}
                    />
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Calculated Grams</CardTitle>
                    <CardDescription>Your daily macro targets in grams based on your goals.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4 text-center">
                    <GramDisplay label="Protein" value={macroGrams.protein} color="text-green-500" />
                    <GramDisplay label="Carbs" value={macroGrams.carbs} color="text-blue-500" />
                    <GramDisplay label="Fat" value={macroGrams.fat} color="text-yellow-500" />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Goal Visualization</CardTitle>
                </CardHeader>
                <CardContent>
                     <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                            {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                        </Pie>
                        <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
      </div>
      
      <CardFooter className="flex flex-col sm:flex-row justify-end gap-3 mt-8 border-t pt-6">
        <Button variant="ghost" onClick={handleReset} disabled={isSaving}>
            <RefreshCw className="mr-2 h-4 w-4" /> Reset to Recommended
        </Button>
        <Button onClick={handleSave} disabled={isSaving || !hasChanges} size="lg">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
            Save Goals
        </Button>
      </CardFooter>
    </div>
  );
}

const MacroSlider = ({label, value, color, onValueChange}: {label: string, value: number, color: string, onValueChange: (value: number) => void}) => (
    <div>
        <div className="flex justify-between mb-2">
            <Label>{label}</Label>
            <span className="font-medium">{value}%</span>
        </div>
        <Slider
            value={[value]}
            onValueChange={([v]) => onValueChange(v)}
            max={100}
            step={1}
            style={{'--slider-color': color} as any}
            className="[&_.bg-primary]:bg-[var(--slider-color)] [&_.border-primary]:border-[var(--slider-color)]"
        />
    </div>
)

const GramDisplay = ({label, value, color}: {label: string, value: number, color: string}) => (
    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
        <p className={`text-3xl font-bold ${color}`}>{Math.round(value)}</p>
        <p className="text-sm text-muted-foreground">{label} (g)</p>
    </motion.div>
)

const GoalsSkeleton = () => (
    <div className="space-y-8">
        <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-8">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-72 w-full" />
            </div>
             <div className="lg:col-span-2 space-y-8">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    </div>
)
