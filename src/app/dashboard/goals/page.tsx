'use client';

import { useState, useMemo, FC } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Flame,
  BrainCircuit,
  Target,
  AlertTriangle,
  Info,
  RotateCcw,
  Save,
  Beef,
  Wheat,
  Droplets,
  Apple,
  Scale,
  Activity,
} from 'lucide-react';
import { mockUser } from '@/lib/data';
import { Progress } from '@/components/ui/progress';

const initialUserGoals = {
  calories: 2200,
  macros: {
    protein: 30, // percentage
    carbs: 45, // percentage
    fat: 25, // percentage
  },
};

const recommendedGoals = {
  'lose-weight': { calories: 1800, macros: { protein: 40, carbs: 35, fat: 25 } },
  'maintain-weight': { calories: 2200, macros: { protein: 30, carbs: 45, fat: 25 } },
  'gain-weight': { calories: 2600, macros: { protein: 35, carbs: 50, fat: 15 } },
  'eat-healthier': { calories: 2000, macros: { protein: 30, carbs: 40, fat: 30 } },
};

const goalMessages: Record<string, string> = {
    'lose-weight': "You're working toward weight loss. Stay consistent and mindful!",
    'maintain-weight': "You're maintaining a healthy lifestyle. Keep up the great work!",
    'gain-weight': "You're building strength and gaining weight. Fuel your body well!",
    'eat-healthier': "You're focused on eating healthier. Every good choice is a victory!",
}

export default function GoalsPage() {
  const { toast } = useToast();
  const [calories, setCalories] = useState(initialUserGoals.calories);
  const [macros, setMacros] = useState(initialUserGoals.macros);

  const totalPercentage = useMemo(() => {
    return macros.protein + macros.carbs + macros.fat;
  }, [macros]);

  const isInvalid = totalPercentage !== 100 || calories < 1200;

  const macroGrams = useMemo(() => {
    const proteinGrams = (calories * (macros.protein / 100)) / 4;
    const carbsGrams = (calories * (macros.carbs / 100)) / 4;
    const fatGrams = (calories * (macros.fat / 100)) / 9;
    return { proteinGrams, carbsGrams, fatGrams };
  }, [calories, macros]);

  const pieChartData = [
    { name: 'Protein', value: macros.protein, color: 'hsl(var(--chart-2))' },
    { name: 'Carbs', value: macros.carbs, color: 'hsl(var(--chart-3))' },
    { name: 'Fat', value: macros.fat, color: 'hsl(var(--chart-4))' },
  ];

  const handleReset = () => {
    const userPrimaryGoal = mockUser.goal || 'maintain-weight';
    const recommended = recommendedGoals[userPrimaryGoal as keyof typeof recommendedGoals];
    setCalories(recommended.calories);
    setMacros(recommended.macros);
    toast({
        title: "Goals Reset!",
        description: "Your goals have been reset to the recommended values."
    });
  };

  const handleSave = () => {
    if (isInvalid) return;
    // In a real app, you'd save this to global state/backend
    console.log("Saving goals:", { calories, macros });
     toast({
        title: "Goals Saved!",
        description: "Your new nutrition targets have been updated.",
    });
  }

  const userGoalMessage = goalMessages[mockUser.goal || 'maintain-weight'];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Nutrition Goals</h1>
            <p className="text-muted-foreground">
              Customize your daily targets to match your health goals.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm bg-muted px-3 py-1.5 rounded-full">
              <Activity className="h-4 w-4 text-primary" />
              <span className="font-medium">{mockUser.goal?.replace('-', ' ') || 'Maintain'}</span>
            </div>
          </div>
        </div>
        
        {userGoalMessage && (
          <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/10">
            <div className="p-2 rounded-full bg-primary/10 shrink-0">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm text-foreground/80">{userGoalMessage}</p>
          </div>
        )}
      </div>
      
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Settings Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Calorie & Macro Card */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/5">
              <CardTitle className="text-xl">Daily Targets</CardTitle>
              <CardDescription>Adjust your total calories and macronutrient distribution</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              {/* Calorie Input */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="calories" className="text-base font-medium flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    Daily Calorie Goal
                  </Label>
                  <span className="text-sm text-muted-foreground">Minimum 1200 kcal</span>
                </div>
                <div className="relative">
                  <Input 
                    id="calories" 
                    type="number" 
                    value={calories} 
                    onChange={(e) => setCalories(Number(e.target.value))} 
                    min={1200} 
                    max={5000} 
                    className="text-2xl font-bold h-14 pl-4 pr-16"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    kcal
                  </span>
                </div>
              </div>
              
              {/* Macro Sliders */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-medium flex items-center gap-2">
                    <Scale className="h-4 w-4 text-muted-foreground" />
                    Macronutrient Distribution
                  </h3>
                  <span className={cn(
                    "text-sm font-medium px-2 py-1 rounded-full",
                    totalPercentage === 100 
                      ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400" 
                      : "bg-destructive/10 text-destructive"
                  )}>
                    {totalPercentage}%
                  </span>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-4">
                    <MacroSlider 
                      label="Protein" 
                      value={macros.protein} 
                      onValueChange={(val) => setMacros(m => ({...m, protein: val}))} 
                      icon={<Beef className="h-4 w-4 text-red-500" />}
                      color="red"
                    />
                    <MacroSlider 
                      label="Carbohydrates" 
                      value={macros.carbs} 
                      onValueChange={(val) => setMacros(m => ({...m, carbs: val}))} 
                      icon={<Wheat className="h-4 w-4 text-yellow-600" />}
                      color="yellow"
                    />
                    <MacroSlider 
                      label="Fat" 
                      value={macros.fat} 
                      onValueChange={(val) => setMacros(m => ({...m, fat: val}))} 
                      icon={<Droplets className="h-4 w-4 text-blue-500" />}
                      color="blue"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            
            {/* Error Alert */}
            {isInvalid && (
              <CardFooter className="border-t p-6">
                <Alert variant="destructive" className="w-full">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {totalPercentage !== 100 
                      ? `Macronutrient total must be exactly 100% (currently ${totalPercentage}%)` 
                      : "Calorie goal must be at least 1200 kcal"}
                  </AlertDescription>
                </Alert>
              </CardFooter>
            )}
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={handleReset}
              className="order-2 sm:order-1"
            >
              <RotateCcw className="mr-2 h-4 w-4" /> 
              Reset to Recommended
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isInvalid} 
              size="lg"
              className="order-1 sm:order-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
            >
              <Save className="mr-2 h-4 w-4" /> 
              Save Goals
            </Button>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-1 space-y-8">
          {/* Gram Calculations Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Scale className="h-4 w-4 text-muted-foreground" />
                Calculated Grams
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Beef className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Protein</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold">{macroGrams.proteinGrams.toFixed(0)}</span>
                  <span className="text-xs text-muted-foreground">g</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Wheat className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">Carbs</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold">{macroGrams.carbsGrams.toFixed(0)}</span>
                  <span className="text-xs text-muted-foreground">g</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Fat</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold">{macroGrams.fatGrams.toFixed(0)}</span>
                  <span className="text-xs text-muted-foreground">g</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Macro Chart */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-2))]" />
                  <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-3))]" />
                  <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-4))]" />
                </div>
                Visual Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie 
                    data={pieChartData} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={70}
                    labelLine={false}
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {pieChartData.map(entry => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Live Preview Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                Today's Progress Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Calories</span>
                  <span className="font-medium">1,530 / {calories} kcal</span>
                </div>
                <Progress value={(1530 / calories) * 100} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Protein</span>
                  <span className="font-medium">80g / {macroGrams.proteinGrams.toFixed(0)}g</span>
                </div>
                <Progress 
                  value={(80 / macroGrams.proteinGrams) * 100} 
                  className="h-2 [&>div]:bg-red-500" 
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Carbs</span>
                  <span className="font-medium">120g / {macroGrams.carbsGrams.toFixed(0)}g</span>
                </div>
                <Progress 
                  value={(120 / macroGrams.carbsGrams) * 100} 
                  className="h-2 [&>div]:bg-yellow-600" 
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fat</span>
                  <span className="font-medium">45g / {macroGrams.fatGrams.toFixed(0)}g</span>
                </div>
                <Progress 
                  value={(45 / macroGrams.fatGrams) * 100} 
                  className="h-2 [&>div]:bg-blue-500" 
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

const MacroSlider: FC<{label: string, value: number, onValueChange: (value: number) => void, icon: React.ReactNode, color: string}> = ({label, value, onValueChange, icon, color}) => {
    const getColorClasses = () => {
        switch(color) {
            case 'red': return 'accent-red-500';
            case 'yellow': return 'accent-yellow-600';
            case 'blue': return 'accent-blue-500';
            default: return '';
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {icon}
                    <Label className="text-sm font-medium">{label}</Label>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-sm font-bold">{value}</span>
                    <span className="text-xs text-muted-foreground">%</span>
                </div>
            </div>
            <Slider 
                value={[value]} 
                onValueChange={(v) => onValueChange(v[0])} 
                max={100} 
                step={1}
                className={cn(
                    "[&_[role=slider]]:h-4 [&_[role=slider]]:w-4",
                    color === 'red' && "[&_[role=slider]]:bg-red-500 [&_.relative]:bg-red-200 dark:[&_.relative]:bg-red-950/50",
                    color === 'yellow' && "[&_[role=slider]]:bg-yellow-600 [&_.relative]:bg-yellow-200 dark:[&_.relative]:bg-yellow-950/50",
                    color === 'blue' && "[&_[role=slider]]:bg-blue-500 [&_.relative]:bg-blue-200 dark:[&_.relative]:bg-blue-950/50"
                )}
            />
        </div>
    );
}

// Add this helper if not already imported
const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');