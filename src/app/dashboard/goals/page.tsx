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
    <div className="space-y-6">
       {/* 1. Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Nutrition Goals</h1>
        <p className="text-muted-foreground">
          Customize your daily targets to match your health goals.
        </p>
         {userGoalMessage && (
            <div className="flex items-center gap-2 text-sm text-primary p-2 bg-primary/10 rounded-md">
                <Target className="h-5 w-5" />
                <p>{userGoalMessage}</p>
            </div>
        )}
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            {/* 2. & 3. Calorie and Macro sections */}
            <Card>
                <CardHeader>
                    <CardTitle>Daily Calorie & Macro Goals</CardTitle>
                    <CardDescription>Adjust your total calories and how they are distributed.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Calorie Input */}
                    <div className="space-y-2">
                        <Label htmlFor="calories" className="text-lg font-medium">Daily Calorie Goal (kcal)</Label>
                        <Input id="calories" type="number" value={calories} onChange={(e) => setCalories(Number(e.target.value))} min={1200} max={5000} className="text-xl h-12"/>
                    </div>
                    
                    {/* Macro Sliders */}
                    <div className="space-y-6">
                         <h3 className="text-lg font-medium">Macronutrient Distribution ({totalPercentage}%)</h3>
                        <div className="space-y-4">
                            <MacroSlider label="Protein" value={macros.protein} onValueChange={(val) => setMacros(m => ({...m, protein: val}))} />
                            <MacroSlider label="Carbohydrates" value={macros.carbs} onValueChange={(val) => setMacros(m => ({...m, carbs: val}))} />
                            <MacroSlider label="Fat" value={macros.fat} onValueChange={(val) => setMacros(m => ({...m, fat: val}))} />
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                     {isInvalid && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4"/>
                            <AlertDescription>
                                Total macronutrient percentage must be exactly 100% to save.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardFooter>
            </Card>

            {/* 6. Save & Reset Section */}
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleReset}><RotateCcw className="mr-2 h-4 w-4"/> Reset to Recommended</Button>
                <Button onClick={handleSave} disabled={isInvalid} size="lg"><Save className="mr-2 h-4 w-4"/> Save Goals</Button>
            </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
            {/* 4. Gram Calculation */}
            <Card>
                <CardHeader><CardTitle>Calculated Grams</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-muted rounded-md">
                        <Label className="flex items-center gap-2"><Beef /> Protein</Label>
                        <span className="font-bold text-lg">{macroGrams.proteinGrams.toFixed(0)}g</span>
                    </div>
                     <div className="flex justify-between items-center p-3 bg-muted rounded-md">
                        <Label className="flex items-center gap-2"><Wheat /> Carbs</Label>
                        <span className="font-bold text-lg">{macroGrams.carbsGrams.toFixed(0)}g</span>
                    </div>
                     <div className="flex justify-between items-center p-3 bg-muted rounded-md">
                        <Label className="flex items-center gap-2"><Droplets /> Fat</Label>
                        <span className="font-bold text-lg">{macroGrams.fatGrams.toFixed(0)}g</span>
                    </div>
                </CardContent>
            </Card>
            
            {/* 5. Visual Preview Chart */}
             <Card>
                <CardHeader><CardTitle>Macro Distribution</CardTitle></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                                {pieChartData.map(entry => <Cell key={entry.name} fill={entry.color} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                            <Legend iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

             {/* 7. Live Impact Preview */}
             <Card>
                <CardHeader><CardTitle>Daily Tracker Preview</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div>
                         <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Calories Consumed</span>
                            <span className="text-sm text-muted-foreground">1530 / {calories} kcal</span>
                        </div>
                        <Progress value={(1530 / calories) * 100} />
                    </div>
                     <div>
                         <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Protein</span>
                            <span className="text-sm text-muted-foreground">80g / {macroGrams.proteinGrams.toFixed(0)}g</span>
                        </div>
                        <Progress value={(80 / macroGrams.proteinGrams) * 100} />
                    </div>
                </CardContent>
             </Card>
        </div>

      </div>
    </div>
  );
}

const MacroSlider: FC<{label: string, value: number, onValueChange: (value: number) => void}> = ({label, value, onValueChange}) => {
    return (
        <div className="space-y-2">
            <div className="flex justify-between">
                <Label>{label}</Label>
                <span className="text-sm font-medium">{value}%</span>
            </div>
            <Slider value={[value]} onValueChange={(v) => onValueChange(v[0])} max={100} step={1} />
        </div>
    );
}