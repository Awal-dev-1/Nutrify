
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
import { 
  Save, 
  RefreshCw, 
  Target, 
  AlertCircle, 
  Info, 
  Flame, 
  Beef, 
  Wheat, 
  Droplets,
  Scale,
  CheckCircle2,
  Loader2,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Heart
} from 'lucide-react';
import { UserProfile } from '@/firebase/provider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    const otherMacros = (['protein', 'carbs', 'fat'] as const).filter(m => m !== changedMacro);
    const [macroA, macroB] = otherMacros;
    const totalOther = newMacros[macroA] + newMacros[macroB];
    if (totalOther > 0) {
      let changeA = delta * (newMacros[macroA] / totalOther);
      let changeB = delta * (newMacros[macroB] / totalOther);
      newMacros[macroA] -= changeA;
      newMacros[macroB] -= changeB;
    } else {
      newMacros[macroA] -= delta / 2;
      newMacros[macroB] -= delta / 2;
    }
    newMacros.protein = Math.max(0, Math.min(100, newMacros.protein));
    newMacros.carbs = Math.max(0, Math.min(100, newMacros.carbs));
    newMacros.fat = Math.max(0, Math.min(100, newMacros.fat));
    const finalTotal = newMacros.protein + newMacros.carbs + newMacros.fat;
    const finalDelta = 100 - finalTotal;
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
    toast({ title: "Goals Reset", description: "Your macros have been reset to our recommended values." });
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
    setInitialState({ calories, macros });
    toast({ title: 'Goals Saved!', description: 'Your nutritional targets have been updated.' });
    setIsSaving(false);
  };

  const hasChanges = useMemo(() => {
    if (!initialState) return false;
    if (calories !== initialState.calories) return true;
    if (macros.protein !== initialState.macros.protein || macros.carbs !== initialState.macros.carbs || macros.fat !== initialState.macros.fat) return true;
    return false;
  }, [calories, macros, initialState]);

  if (isProfileLoading) return <GoalsSkeleton />;

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-3">
        <Alert variant="destructive" className="max-w-md w-full">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="text-lg">Error Loading Profile</AlertTitle>
          <AlertDescription>Could not load user profile. Please try again later.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const pieData = [
    { name: 'Protein', value: macros.protein, color: MACRO_COLORS.protein },
    { name: 'Carbs', value: macros.carbs, color: MACRO_COLORS.carbs },
    { name: 'Fat', value: macros.fat, color: MACRO_COLORS.fat },
  ];

  const goalMessage = {
    'lose-weight': { message: "You're working toward weight loss. Consistency is key!", icon: TrendingDown, color: 'text-blue-500' },
    'gain-weight': { message: "You're building muscle. Fuel your body for growth!", icon: TrendingUp, color: 'text-green-500' },
    'maintain-weight': { message: "You're maintaining a healthy weight. Great job on the balance!", icon: Scale, color: 'text-purple-500' },
    'eat-healthier': { message: "You're focused on healthier eating. Every choice is a step forward!", icon: Heart, color: 'text-red-500' },
  }[userProfile.health?.primaryGoal || 'maintain-weight'];

  const GoalIcon = goalMessage.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/5 pb-8 md:pb-12">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-8 space-y-4 md:space-y-8">

        {/* Header */}
        <div className="space-y-3 md:space-y-4">
          <div className="flex flex-col xs:flex-row xs:items-center gap-3">
            <div className="shrink-0 p-2.5 sm:p-3 md:p-4 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg w-fit">
              <Target className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Nutrition Goals
              </h1>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground mt-0.5">
                Customize your daily targets to match your health goals
              </p>
            </div>
          </div>

          <Alert className="border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
            <GoalIcon className={`h-4 w-4 shrink-0 ${goalMessage.color}`} />
            <div className="flex-1 min-w-0">
              <AlertTitle className={`${goalMessage.color} font-semibold text-sm sm:text-base`}>
                {userProfile.health?.primaryGoal?.split('-').map(word =>
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')} Mode
              </AlertTitle>
              <AlertDescription className="text-xs sm:text-sm text-foreground/80">
                {goalMessage.message}
              </AlertDescription>
            </div>
          </Alert>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

          {/* Left / Main column */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">

            {/* Calorie Target */}
            <Card className="border shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b p-4 sm:p-5 md:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="shrink-0 p-1.5 rounded-lg bg-primary/10">
                    <Flame className="h-4 w-4 text-primary" />
                  </div>
                  Daily Calorie Target
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Set your daily energy intake goal
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 md:p-6">
                <div className="space-y-2">
                  <Label htmlFor="calories" className="text-xs sm:text-sm font-medium">
                    Daily Calories (kcal)
                  </Label>
                  <div className="relative w-full sm:max-w-xs">
                    <Input
                      id="calories"
                      type="number"
                      value={calories}
                      onChange={(e) => setCalories(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="text-sm sm:text-base pr-14 py-2 sm:py-3 rounded-lg border-2 focus:border-primary h-10 sm:h-12"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs">
                        kcal
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Macro Distribution */}
            <Card className="border shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b p-4 sm:p-5 md:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="shrink-0 p-1.5 rounded-lg bg-primary/10">
                    <Scale className="h-4 w-4 text-primary" />
                  </div>
                  Macronutrient Distribution
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Adjust the percentage of your daily calories from each macro
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 md:p-6 space-y-5 sm:space-y-6 md:space-y-8">
                <MacroSlider
                  label="Protein"
                  value={macros.protein}
                  color={MACRO_COLORS.protein}
                  icon={Beef}
                  onValueChange={(v) => handleMacroChange('protein', v)}
                />
                <MacroSlider
                  label="Carbohydrates"
                  value={macros.carbs}
                  color={MACRO_COLORS.carbs}
                  icon={Wheat}
                  onValueChange={(v) => handleMacroChange('carbs', v)}
                />
                <MacroSlider
                  label="Fat"
                  value={macros.fat}
                  color={MACRO_COLORS.fat}
                  icon={Droplets}
                  onValueChange={(v) => handleMacroChange('fat', v)}
                />

                {/* Quick % Stats */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2 border-t">
                  <div className="text-center p-2 sm:p-3 rounded-lg bg-muted/30">
                    <p className="text-base sm:text-lg md:text-2xl font-bold" style={{color: MACRO_COLORS.protein}}>{macros.protein}%</p>
                    <p className="text-xs text-muted-foreground">Protein</p>
                  </div>
                  <div className="text-center p-2 sm:p-3 rounded-lg bg-muted/30">
                    <p className="text-base sm:text-lg md:text-2xl font-bold" style={{color: MACRO_COLORS.carbs}}>{macros.carbs}%</p>
                    <p className="text-xs text-muted-foreground">Carbs</p>
                  </div>
                  <div className="text-center p-2 sm:p-3 rounded-lg bg-muted/30">
                    <p className="text-base sm:text-lg md:text-2xl font-bold" style={{color: MACRO_COLORS.fat}}>{macros.fat}%</p>
                    <p className="text-xs text-muted-foreground">Fat</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right / Analytics column */}
          {/* On mobile stacks below; on lg sits beside */}
          <div className="lg:col-span-1 space-y-4 md:space-y-6">

            {/* Daily Grams */}
            <Card className="border shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b p-4 sm:p-5 md:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="shrink-0 p-1.5 rounded-lg bg-primary/10">
                    <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  </div>
                  Daily Grams
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Your macro targets in grams
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 md:p-6 space-y-3">
                <GramDisplay
                  label="Protein"
                  value={macroGrams.protein}
                  color={MACRO_COLORS.protein}
                  icon={Beef}
                  total={macroGrams.protein + macroGrams.carbs + macroGrams.fat}
                />
                <GramDisplay
                  label="Carbs"
                  value={macroGrams.carbs}
                  color={MACRO_COLORS.carbs}
                  icon={Wheat}
                  total={macroGrams.protein + macroGrams.carbs + macroGrams.fat}
                />
                <GramDisplay
                  label="Fat"
                  value={macroGrams.fat}
                  color={MACRO_COLORS.fat}
                  icon={Droplets}
                  total={macroGrams.protein + macroGrams.carbs + macroGrams.fat}
                />
              </CardContent>
            </Card>

            {/* Pie Chart */}
            <Card className="border shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b p-4 sm:p-5 md:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="shrink-0 p-1.5 rounded-lg bg-primary/10">
                    <PieChart className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  </div>
                  Visual Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 md:p-6">
                {/* Chart is taller on mobile since it's full-width; compact on lg sidebar */}
                <div className="h-[180px] sm:h-[200px] lg:h-[180px] xl:h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={38}
                        outerRadius={58}
                        paddingAngle={4}
                        label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                        labelLine={false}
                      >
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          fontSize: '12px',
                        }}
                        formatter={(value: number) => [`${value}%`, 'Percentage']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 border-t pt-4 md:pt-6 bg-gradient-to-r from-transparent via-primary/5 to-transparent rounded-lg p-3 sm:p-4 md:p-6">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isSaving}
            className="w-full sm:w-auto rounded-lg px-4 sm:px-6 h-10 sm:h-11 text-xs sm:text-sm border-2 hover:border-primary/50 transition-all"
          >
            <RefreshCw className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            Reset to Recommended
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            size="lg"
            className="w-full sm:w-auto rounded-lg px-5 sm:px-8 h-10 sm:h-11 text-xs sm:text-sm bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all"
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4 shrink-0" />
            )}
            Save Goals
            {hasChanges && <ChevronRight className="ml-1 sm:ml-2 h-4 w-4 shrink-0" />}
          </Button>
        </div>

        {/* Up-to-date indicator */}
        {!hasChanges && initialState && (
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 shrink-0" />
            <span>All goals are up to date</span>
          </div>
        )}
      </div>
    </div>
  );
}

// MacroSlider
const MacroSlider = ({ label, value, color, icon: Icon, onValueChange }: {
  label: string;
  value: number;
  color: string;
  icon: any;
  onValueChange: (value: number) => void;
}) => (
  <div className="space-y-2 sm:space-y-3">
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
        <div className="shrink-0 p-1 sm:p-1.5 rounded-md" style={{ backgroundColor: color.replace(')', ', 0.1)').replace('hsl', 'hsla') }}>
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color }} />
        </div>
        <Label className="text-xs sm:text-sm font-medium truncate">{label}</Label>
      </div>
      <Badge variant="outline" className="shrink-0 text-sm sm:text-base font-semibold px-2 sm:px-3 py-0.5">
        {value}%
      </Badge>
    </div>
    <Slider
      value={[value]}
      onValueChange={([v]) => onValueChange(v)}
      max={100}
      step={1}
      style={{ '--slider-color': color } as any}
      className="[&_.bg-primary]:bg-[var(--slider-color)] [&_.border-primary]:border-[var(--slider-color)] [&_.bg-primary]:shadow-lg"
    />
    <div className="flex justify-between text-xs text-muted-foreground">
      <span>0%</span>
      <span className="hidden xs:inline">50%</span>
      <span>100%</span>
    </div>
  </div>
);

// GramDisplay
const GramDisplay = ({ label, value, color, icon: Icon, total }: {
  label: string;
  value: number;
  color: string;
  icon: any;
  total: number;
}) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between mb-1.5 sm:mb-2 gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="shrink-0 p-1 sm:p-1.5 rounded-md" style={{ backgroundColor: color.replace(')', ', 0.1)').replace('hsl', 'hsla') }}>
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color }} />
          </div>
          <span className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{label}</span>
        </div>
        <span className={`shrink-0 text-lg sm:text-xl md:text-2xl font-bold`} style={{ color }}>{Math.round(value)}</span>
      </div>
      <div className="space-y-0.5 sm:space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">of total</span>
          <span className="font-medium">{percentage.toFixed(0)}%</span>
        </div>
        <Progress value={percentage} className="h-1 sm:h-1.5" indicatorStyle={{ backgroundColor: color }} />
      </div>
      <p className="text-xs text-muted-foreground mt-1 sm:mt-2">grams per day</p>
    </motion.div>
  );
};

// Skeleton
const GoalsSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-b from-background to-secondary/5 pb-8 md:pb-12">
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-8 space-y-4 md:space-y-8">
      <div className="space-y-3 md:space-y-4">
        <div className="flex flex-col xs:flex-row xs:items-center gap-3">
          <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 rounded-xl" />
          <div className="flex-1">
            <Skeleton className="h-6 sm:h-8 md:h-10 w-48 sm:w-56 md:w-64 mb-1.5" />
            <Skeleton className="h-3.5 sm:h-4 md:h-5 w-56 sm:w-72 md:w-96" />
          </div>
        </div>
        <Skeleton className="h-14 sm:h-16 md:h-20 w-full rounded-lg" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <Skeleton className="h-32 sm:h-40 md:h-48 w-full rounded-xl" />
          <Skeleton className="h-56 sm:h-64 md:h-80 w-full rounded-xl" />
        </div>
        <div className="space-y-4 md:space-y-6">
          <Skeleton className="h-48 sm:h-56 md:h-64 w-full rounded-xl" />
          <Skeleton className="h-44 sm:h-48 md:h-56 w-full rounded-xl" />
        </div>
      </div>
      <Skeleton className="h-14 sm:h-16 md:h-20 w-full rounded-lg" />
    </div>
  </div>
);
