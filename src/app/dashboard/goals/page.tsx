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

  const goalProgress = {
    protein: (macros.protein / 100) * 100,
    carbs: (macros.carbs / 100) * 100,
    fat: (macros.fat / 100) * 100,
  };

  if (isProfileLoading) {
    return <GoalsSkeleton />;
  }

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Alert variant="destructive" className="max-w-md w-full mx-4">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="text-lg">Error Loading Profile</AlertTitle>
          <AlertDescription>Could not load user profile. Please try again later.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const pieData = [
    { name: 'Protein', value: macros.protein, color: MACRO_COLORS.protein },
    { name: 'Carbs', value: macros.carbs, color: MACRO_COLORS.carbs },
    { name: 'Fat', value: macros.fat, color: MACRO_COLORS.fat },
  ];
  
  const goalMessage = {
      'lose-weight': {
        message: "You're working toward weight loss. Consistency is key!",
        icon: TrendingDown,
        color: 'text-blue-500'
      },
      'gain-weight': {
        message: "You're building muscle. Fuel your body for growth!",
        icon: TrendingUp,
        color: 'text-green-500'
      },
      'maintain-weight': {
        message: "You're maintaining a healthy weight. Great job on the balance!",
        icon: Scale,
        color: 'text-purple-500'
      },
      'eat-healthier': {
        message: "You're focused on healthier eating. Every choice is a step forward!",
        icon: Heart,
        color: 'text-red-500'
      },
  }[userProfile.health?.primaryGoal || 'maintain-weight'];

  const GoalIcon = goalMessage.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/5 pb-8 md:pb-12">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-8 space-y-4 md:space-y-8">
        {/* Header Section - Responsive */}
        <div className="space-y-3 md:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
            <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg w-fit">
              <Target className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Nutrition Goals
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground mt-0.5 md:mt-1">
                Customize your daily targets to match your health goals
              </p>
            </div>
          </div>

          <Alert className="border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
            <GoalIcon className={`h-4 w-4 md:h-5 md:w-5 ${goalMessage.color} shrink-0`} />
            <div className="flex-1 min-w-0">
              <AlertTitle className={`${goalMessage.color} font-semibold text-sm md:text-base`}>
                {userProfile.health?.primaryGoal?.split('-').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')} Mode
              </AlertTitle>
              <AlertDescription className="text-xs md:text-sm text-foreground/80">
                {goalMessage.message}
              </AlertDescription>
            </div>
          </Alert>
        </div>

        {/* Main Content Grid - Fully Responsive */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          {/* Left Column - Goal Settings */}
          <div className="md:col-span-2 space-y-4 md:space-y-6 lg:space-y-8">
            {/* Calorie Target Card */}
            <Card className="border shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg lg:text-xl">
                  <div className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-primary/10">
                    <Flame className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  Daily Calorie Target
                </CardTitle>
                <CardDescription className="text-xs md:text-sm lg:text-base">
                  Set your daily energy intake goal
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="space-y-2 md:space-y-3">
                  <Label htmlFor="calories" className="text-xs md:text-sm font-medium">
                    Daily Calories (kcal)
                  </Label>
                  <div className="relative max-w-full md:max-w-xs">
                    <Input 
                      id="calories"
                      type="number"
                      value={calories}
                      onChange={(e) => setCalories(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="text-base md:text-lg pl-3 md:pl-4 pr-12 py-4 md:py-6 rounded-lg md:rounded-xl border-2 focus:border-primary"
                    />
                    <div className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2">
                      <Badge variant="secondary" className="rounded-full px-2 md:px-3 py-0.5 md:py-1 text-xs">
                        kcal
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Macro Distribution Card */}
            <Card className="border shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg lg:text-xl">
                  <div className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-primary/10">
                    <Scale className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  Macronutrient Distribution
                </CardTitle>
                <CardDescription className="text-xs md:text-sm lg:text-base">
                  Adjust the percentage of your daily calories from each macro
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6 lg:space-y-8">
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

                {/* Quick Stats - Responsive Grid */}
                <div className="grid grid-cols-3 gap-2 md:gap-4 pt-2 md:pt-4">
                  <div className="text-center p-2 md:p-3 rounded-lg md:rounded-xl bg-muted/30">
                    <p className="text-lg md:text-xl lg:text-2xl font-bold text-green-500">{macros.protein}%</p>
                    <p className="text-xs text-muted-foreground truncate">Protein</p>
                  </div>
                  <div className="text-center p-2 md:p-3 rounded-lg md:rounded-xl bg-muted/30">
                    <p className="text-lg md:text-xl lg:text-2xl font-bold text-blue-500">{macros.carbs}%</p>
                    <p className="text-xs text-muted-foreground truncate">Carbs</p>
                  </div>
                  <div className="text-center p-2 md:p-3 rounded-lg md:rounded-xl bg-muted/30">
                    <p className="text-lg md:text-xl lg:text-2xl font-bold text-yellow-500">{macros.fat}%</p>
                    <p className="text-xs text-muted-foreground truncate">Fat</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Analytics */}
          <div className="space-y-4 md:space-y-6 lg:space-y-8">
            {/* Grams Display Card */}
            <Card className="border shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <div className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-primary/10">
                    <Target className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                  </div>
                  Daily Grams
                </CardTitle>
                <CardDescription className="text-xs">
                  Your macro targets in grams
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-3 md:space-y-4">
                <GramDisplay 
                  label="Protein" 
                  value={macroGrams.protein} 
                  color="text-green-500"
                  icon={Beef}
                  total={macroGrams.protein + macroGrams.carbs + macroGrams.fat}
                />
                <GramDisplay 
                  label="Carbs" 
                  value={macroGrams.carbs} 
                  color="text-blue-500"
                  icon={Wheat}
                  total={macroGrams.protein + macroGrams.carbs + macroGrams.fat}
                />
                <GramDisplay 
                  label="Fat" 
                  value={macroGrams.fat} 
                  color="text-yellow-500"
                  icon={Droplets}
                  total={macroGrams.protein + macroGrams.carbs + macroGrams.fat}
                />
              </CardContent>
            </Card>

            {/* Visualization Card */}
            <Card className="border shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <div className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-primary/10">
                    <PieChart className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                  </div>
                  Visual Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="h-[160px] sm:h-[180px] md:h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={pieData} 
                        dataKey="value" 
                        nameKey="name" 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={40}
                        outerRadius={60}
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

        {/* Footer Actions - Responsive */}
        <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 md:gap-3 mt-4 md:mt-8 border-t pt-4 md:pt-8 bg-gradient-to-r from-transparent via-primary/5 to-transparent rounded-lg p-4 md:p-6">
          <Button 
            variant="outline" 
            onClick={handleReset} 
            disabled={isSaving}
            className="w-full sm:w-auto rounded-lg md:rounded-xl px-4 md:px-6 py-4 md:py-6 h-auto text-sm md:text-base border-2 hover:border-primary/50 transition-all"
          >
            <RefreshCw className="mr-2 h-3 w-3 md:h-4 md:w-4" /> 
            Reset to Recommended
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !hasChanges} 
            size="lg"
            className="w-full sm:w-auto rounded-lg md:rounded-xl px-6 md:px-8 py-4 md:py-6 h-auto text-sm md:text-base bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all"
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin"/>
            ) : (
              <Save className="mr-2 h-4 w-4 md:h-5 md:w-5" />
            )}
            Save Goals
            {hasChanges && <ChevronRight className="ml-1 md:ml-2 h-4 w-4 md:h-5 md:w-5" />}
          </Button>
        </CardFooter>

        {/* Success Indicator */}
        {!hasChanges && initialState && (
          <div className="flex items-center justify-center gap-2 text-xs md:text-sm text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
            <span>All goals are up to date</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Enhanced MacroSlider Component - Responsive
const MacroSlider = ({label, value, color, icon: Icon, onValueChange}: {label: string, value: number, color: string, icon: any, onValueChange: (value: number) => void}) => (
  <div className="space-y-2 md:space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5 md:gap-2">
        <div className="p-1 md:p-1.5 rounded-md md:rounded-lg" style={{ backgroundColor: `${color}20` }}>
          <Icon className="h-3 w-3 md:h-4 md:w-4" style={{ color }} />
        </div>
        <Label className="text-xs md:text-sm lg:text-base font-medium">{label}</Label>
      </div>
      <Badge variant="outline" className="text-sm md:text-base lg:text-lg font-semibold px-2 md:px-3 py-0.5 md:py-1">
        {value}%
      </Badge>
    </div>
    <Slider
      value={[value]}
      onValueChange={([v]) => onValueChange(v)}
      max={100}
      step={1}
      style={{'--slider-color': color} as any}
      className="[&_.bg-primary]:bg-[var(--slider-color)] [&_.border-primary]:border-[var(--slider-color)] [&_.bg-primary]:shadow-lg"
    />
    <div className="flex justify-between text-xs text-muted-foreground">
      <span>0%</span>
      <span className="hidden sm:inline">50%</span>
      <span>100%</span>
    </div>
  </div>
)

// Enhanced GramDisplay Component - Responsive
const GramDisplay = ({label, value, color, icon: Icon, total}: {label: string, value: number, color: string, icon: any, total: number}) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <motion.div 
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="p-3 md:p-4 rounded-lg md:rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between mb-1 md:mb-2">
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="p-1 md:p-1.5 rounded-md md:rounded-lg" style={{ backgroundColor: `${color}20` }}>
            <Icon className="h-3 w-3 md:h-4 md:w-4" style={{ color }} />
          </div>
          <span className="text-xs md:text-sm font-medium text-muted-foreground">{label}</span>
        </div>
        <span className={`text-lg md:text-xl lg:text-2xl font-bold ${color}`}>{Math.round(value)}</span>
      </div>
      <div className="space-y-0.5 md:space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">of total</span>
          <span className="font-medium">{percentage.toFixed(0)}%</span>
        </div>
        <Progress value={percentage} className="h-1 md:h-1.5" style={{ '--progress-background': color } as any} />
      </div>
      <p className="text-xs text-muted-foreground mt-1 md:mt-2">grams per day</p>
    </motion.div>
  );
}

// Enhanced Skeleton - Responsive
const GoalsSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-b from-background to-secondary/5 pb-8 md:pb-12">
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-8 space-y-4 md:space-y-8">
      <div className="space-y-3 md:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
          <Skeleton className="h-12 w-12 md:h-16 md:w-16 rounded-xl md:rounded-2xl" />
          <div className="flex-1">
            <Skeleton className="h-6 w-48 md:h-12 md:w-64 mb-1 md:mb-2" />
            <Skeleton className="h-4 w-64 md:h-6 md:w-96" />
          </div>
        </div>
        <Skeleton className="h-16 md:h-20 w-full rounded-lg md:rounded-xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
        <div className="md:col-span-2 space-y-4 md:space-y-6 lg:space-y-8">
          <Skeleton className="h-40 md:h-48 lg:h-56 w-full rounded-xl md:rounded-2xl" />
          <Skeleton className="h-64 md:h-80 lg:h-96 w-full rounded-xl md:rounded-2xl" />
        </div>
        <div className="space-y-4 md:space-y-6 lg:space-y-8">
          <Skeleton className="h-56 md:h-64 lg:h-72 w-full rounded-xl md:rounded-2xl" />
          <Skeleton className="h-48 md:h-56 lg:h-64 w-full rounded-xl md:rounded-2xl" />
        </div>
      </div>
      
      <Skeleton className="h-16 md:h-20 w-full rounded-lg md:rounded-xl" />
    </div>
  </div>
)