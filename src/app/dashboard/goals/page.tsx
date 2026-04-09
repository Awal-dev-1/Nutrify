
'use client';

import { useState, useEffect, useMemo, type FC } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { updateUserGoalsAndProfile, calculateRecommendedGoals } from '@/services/goalsService';
import { generateNutrientGoals, type GenerateNutrientGoalsOutput } from '@/ai/flows/generate-nutrient-goals-flow';
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
import { PieChart as PieChartComponent, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
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
  Heart,
  User,
  Activity,
  PieChart as PieChartIcon,
  Sparkles,
  Atom,
  Shield,
} from 'lucide-react';
import { UserProfile } from '@/firebase/provider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { NUTRIENT_LABELS, NUTRIENT_UNITS, NUTRIENT_DESCRIPTIONS, MicronutrientKey, VITAMIN_KEYS, MINERAL_KEYS, NUTRIENT_GOAL_KEYS } from '@/lib/nutrients';


const MACRO_COLORS = {
  protein: 'hsl(var(--chart-2))',
  carbs: 'hsl(var(--chart-3))',
  fat: 'hsl(var(--chart-4))',
};

const preferenceGroups = {
  "Common Diets": [
    'Vegetarian', 'Vegan', 'Pescatarian', 'Flexitarian', 'Omnivore (no restrictions)'
  ],
  "Health & Medical Diets": [
    'Gluten-Free', 'Lactose-Free / Dairy-Free', 'Low-Carb', 'Keto', 'Paleo', 'Low-Fat', 'Low-Sodium', 'Diabetic-Friendly', 'Heart-Healthy'
  ],
  "Allergies & Intolerances": [
    'Nut-Free', 'Peanut-Free', 'Shellfish-Free', 'Egg-Free', 'Soy-Free', 'Wheat-Free'
  ],
  "Religious & Cultural Diets": [
    'Halal', 'Kosher'
  ],
};

type MicroGoalState = {
  [K in typeof NUTRIENT_GOAL_KEYS[number]]?: number;
};

export default function GoalsPage() {
  const { user, userProfile, isProfileLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('targets');
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingAI, setIsSyncingAI] = useState(false);

  // Targets state
  const [calories, setCalories] = useState<number>(2000);
  const [macros, setMacros] = useState({ protein: 30, carbs: 40, fat: 30 });
  const [microGoals, setMicroGoals] = useState<MicroGoalState>({});

  // Profile state
  const [profileData, setProfileData] = useState({
      activityLevel: '', primaryGoal: '', age: 0, gender: '',
      heightCm: 0, weightKg: 0, dietaryPreferences: [] as string[],
  });

  const [initialState, setInitialState] = useState<any>(null);

  useEffect(() => {
    if (userProfile) {
      const goals = userProfile.goals || {};
      const initialMicros: MicroGoalState = {};
      NUTRIENT_GOAL_KEYS.forEach(key => {
        initialMicros[key] = goals[key] as number | undefined;
      });

      const initial = {
        calories: goals.dailyCalorieGoal || 2000,
        macros: {
          protein: goals.proteinPercentageGoal || 30,
          carbs: goals.carbsPercentageGoal || 40,
          fat: goals.fatPercentageGoal || 30,
        },
        micros: initialMicros,
        profile: {
          activityLevel: userProfile.profile?.activityLevel || '',
          primaryGoal: userProfile.health?.primaryGoal || '',
          age: userProfile.profile?.age || 0,
          gender: userProfile.profile?.gender || '',
          heightCm: userProfile.profile?.heightCm || 0,
          weightKg: userProfile.profile?.weightKg || 0,
          dietaryPreferences: userProfile.health?.dietaryPreferences || [],
        }
      };
      setCalories(initial.calories);
      setMacros(initial.macros);
      setMicroGoals(initial.micros);
      setProfileData(initial.profile);
      setInitialState(initial);
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
    let newMacros = { ...macros, [changedMacro]: value };
    const total = newMacros.protein + newMacros.carbs + newMacros.fat;
    if (total > 100) {
        const otherMacros = (['protein', 'carbs', 'fat'] as const).filter(m => m !== changedMacro);
        let over = total - 100;
        newMacros[otherMacros[0]] -= over / 2;
        newMacros[otherMacros[1]] -= over / 2;
    } else if (total < 100) {
         newMacros[changedMacro] += 100 - total;
    }

    setMacros({
      protein: Math.max(0, Math.round(newMacros.protein)),
      carbs: Math.max(0, Math.round(newMacros.carbs)),
      fat: Math.max(0, Math.round(newMacros.fat)),
    });
  };

  const handleReset = () => {
    if (!profileData.primaryGoal || !userProfile?.profile?.weightKg) {
      toast({
        variant: "destructive",
        title: "Profile Incomplete",
        description: "Please complete your profile to get recommended goals.",
      });
      setActiveTab('profile');
      return;
    }

    const recommended = calculateRecommendedGoals({
        primaryGoal: profileData.primaryGoal,
        weightKg: userProfile.profile.weightKg,
        activityLevel: profileData.activityLevel
    });

    setCalories(recommended.dailyCalorieGoal);
    setMacros({
      protein: recommended.proteinPercentageGoal,
      carbs: recommended.carbsPercentageGoal,
      fat: recommended.fatPercentageGoal
    });
    setMicroGoals({}); // Reset micros to default
    toast({ title: "Goals Reset", description: "Your targets have been reset to our recommended values based on your profile." });
  };

  const handleAiSync = async () => {
      if(!userProfile?.profile || !userProfile?.health) {
          toast({ variant: 'destructive', title: 'Profile Incomplete', description: 'Please fill out your profile details to use AI Sync.' });
          setActiveTab('profile');
          return;
      }
      setIsSyncingAI(true);
      try {
          const input = {
              gender: userProfile.profile.gender,
              age: userProfile.profile.age,
              heightCm: userProfile.profile.heightCm,
              weightKg: userProfile.profile.weightKg,
              activityLevel: userProfile.profile.activityLevel,
              primaryGoal: userProfile.health.primaryGoal,
          }
          const result = await generateNutrientGoals(input);

          const staggeredUpdate = (setter: Function, value: any, delay: number) => {
              setTimeout(() => setter(value), delay);
          };

          staggeredUpdate(setCalories, result.dailyCalorieGoal, 0);
          staggeredUpdate(setMacros, {
              protein: result.proteinPercentageGoal,
              carbs: result.carbsPercentageGoal,
              fat: result.fatPercentageGoal,
          }, 200);

          const aiMicroGoals: MicroGoalState = {};
          NUTRIENT_GOAL_KEYS.forEach(key => {
            if (key in result) {
              aiMicroGoals[key] = (result as any)[key];
            }
          });
          staggeredUpdate(setMicroGoals, aiMicroGoals, 400);

          toast({ title: "AI Sync Complete!", description: "Your goals have been updated with AI recommendations." });

      } catch (e: any) {
          toast({ variant: 'destructive', title: 'AI Sync Failed', description: e.message || 'Could not fetch AI recommendations.' });
      } finally {
          setIsSyncingAI(false);
      }
  }

  const handleSave = async () => {
    if (!user || !db) return;
    setIsSaving(true);
    const updates: Record<string, any> = {
        'goals.dailyCalorieGoal': calories,
        'goals.proteinPercentageGoal': macros.protein,
        'goals.carbsPercentageGoal': macros.carbs,
        'goals.fatPercentageGoal': macros.fat,
        'profile.activityLevel': profileData.activityLevel,
        'health.primaryGoal': profileData.primaryGoal,
        'profile.age': Number(profileData.age),
        'profile.gender': profileData.gender,
        'profile.heightCm': Number(profileData.heightCm),
        'profile.weightKg': Number(profileData.weightKg),
        'health.dietaryPreferences': profileData.dietaryPreferences,
    };

    NUTRIENT_GOAL_KEYS.forEach(key => {
        updates[`goals.${key}`] = microGoals[key] ?? null; // Use null to remove field if undefined
    });

    try {
        await updateUserGoalsAndProfile(db, user.uid, updates);
        setInitialState({ calories, macros, micros: microGoals, profile: profileData });
        toast({ title: 'Goals & Profile Saved!', description: 'Your nutritional profile and targets have been updated.' });
    } catch(e: any) {
        toast({
            variant: "destructive",
            title: "Error Saving",
            description: "There was a problem saving your data. Please try again.",
        });
    } finally {
        setIsSaving(false);
    }
  };

  const hasChanges = useMemo(() => {
    if (!initialState) return false;
    if (calories !== initialState.calories) return true;
    if (macros.protein !== initialState.macros.protein || macros.carbs !== initialState.macros.carbs || macros.fat !== initialState.macros.fat) return true;
    
    for (const key of NUTRIENT_GOAL_KEYS) {
        if ((microGoals[key] || 0) !== (initialState.micros[key] || 0)) return true;
    }

    if (
        profileData.activityLevel !== initialState.profile.activityLevel ||
        profileData.primaryGoal !== initialState.profile.primaryGoal ||
        Number(profileData.age) !== initialState.profile.age ||
        profileData.gender !== initialState.profile.gender ||
        Number(profileData.heightCm) !== initialState.profile.heightCm ||
        Number(profileData.weightKg) !== initialState.profile.weightKg ||
        JSON.stringify(profileData.dietaryPreferences.sort()) !== JSON.stringify((initialState.profile.dietaryPreferences || []).sort())
    ) return true;
    return false;
  }, [calories, macros, microGoals, profileData, initialState]);

  const handleProfileFieldChange = (field: keyof typeof profileData, value: string | number) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  }

  const handleMicroGoalChange = (field: keyof MicroGoalState, value: string) => {
      setMicroGoals(prev => ({ ...prev, [field]: Number(value) || undefined }))
  }

  const handlePreferenceSelect = (preference: string) => {
    setProfileData(prev => {
        const currentPrefs = prev.dietaryPreferences || [];
        let newPrefs;
        if (preference === 'Omnivore (no restrictions)') {
            newPrefs = currentPrefs.includes(preference) ? [] : ['Omnivore (no restrictions)'];
        } else {
            let tempPrefs = currentPrefs.filter(p => p !== 'Omnivore (no restrictions)');
            if (tempPrefs.includes(preference)) {
                newPrefs = tempPrefs.filter(p => p !== preference);
            } else {
                newPrefs = [...tempPrefs, preference];
            }
        }
        return { ...prev, dietaryPreferences: newPrefs };
    });
  };

  if (isProfileLoading || !initialState) return <GoalsSkeleton />;

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-[calc(10vh-200px)] px-3">
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

  const microGoalFields = {
    Minerals: MINERAL_KEYS,
    Vitamins: VITAMIN_KEYS,
  } as const;

  return (
    <div>
      <div className="w-full max-w-7xl mx-auto space-y-4 md:space-y-8">
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center gap-3">
            <div className="shrink-0 p-2.5 sm:p-3 md:p-4 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg w-fit">
              <Target className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-h1 font-bold text-primary">
                Nutrition Goals
              </h1>
              <p className="text-body text-muted-foreground mt-0.5">
                Customize your daily targets to match your health goals
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-12 p-1.5">
                <TabsTrigger value="targets" className="text-sm gap-2 h-full">
                    <Target className="h-4 w-4" /> Targets
                </TabsTrigger>
                <TabsTrigger value="profile" className="text-sm gap-2 h-full">
                    <User className="h-4 w-4" /> Profile
                </TabsTrigger>
            </TabsList>

            <TabsContent value="targets" className="mt-6">
                <div className="flex justify-end mb-4">
                    <Button onClick={handleAiSync} disabled={isSyncingAI} variant="outline" className="rounded-full shadow-sm">
                        {isSyncingAI ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4 text-primary"/>}
                        Generate Full Health Profile
                    </Button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    <div className="lg:col-span-2 space-y-4 md:space-y-6">
                        <Card className="border shadow-lg overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b p-4 sm:p-5 md:p-6">
                                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <Flame className="h-4 w-4 text-primary" />Daily Calorie Target</CardTitle>
                                <CardDescription className="text-xs sm:text-sm">Set your daily energy intake goal</CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-5 md:p-6">
                                <div className="space-y-2"><Label htmlFor="calories" className="text-xs sm:text-sm font-medium">Daily Calories (kcal)</Label>
                                <div className="relative w-full sm:max-w-xs"><Input id="calories" type="number" value={calories} onChange={(e) => setCalories(Math.max(0, parseInt(e.target.value, 10) || 0))} className="text-sm sm:text-base pr-14 py-2 sm:py-3 rounded-lg border-2 focus:border-primary h-10 sm:h-12" />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2"><Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs">kcal</Badge></div></div></div>
                            </CardContent>
                        </Card>
                        <Card className="border shadow-lg overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b p-4 sm:p-5 md:p-6">
                                <CardTitle className="flex items-center gap-2 text-base sm:text-lg"><Scale className="h-4 w-4 text-primary" />Macronutrient Distribution</CardTitle>
                                <CardDescription className="text-xs sm:text-sm">Adjust the percentage of your daily calories from each macro</CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-5 md:p-6 space-y-5 sm:space-y-6 md:space-y-8">
                                <MacroSlider label="Protein" value={macros.protein} color={MACRO_COLORS.protein} icon={Beef} onValueChange={(v) => handleMacroChange('protein', v)} />
                                <MacroSlider label="Carbohydrates" value={macros.carbs} color={MACRO_COLORS.carbs} icon={Wheat} onValueChange={(v) => handleMacroChange('carbs', v)} />
                                <MacroSlider label="Fat" value={macros.fat} color={MACRO_COLORS.fat} icon={Droplets} onValueChange={(v) => handleMacroChange('fat', v)} />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-1 space-y-4 md:space-y-6">
                        <Card className="border shadow-lg"><CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b p-4 sm:p-5 md:p-6">
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg"><Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />Daily Grams</CardTitle>
                            <CardDescription className="text-xs sm:text-sm">Your macro targets in grams</CardDescription></CardHeader>
                            <CardContent className="p-4 sm:p-5 md:p-6 space-y-3">
                                <GramDisplay label="Protein" value={macroGrams.protein} color={MACRO_COLORS.protein} icon={Beef} total={macroGrams.protein + macroGrams.carbs + macroGrams.fat} />
                                <GramDisplay label="Carbs" value={macroGrams.carbs} color={MACRO_COLORS.carbs} icon={Wheat} total={macroGrams.protein + macroGrams.carbs + macroGrams.fat} />
                                <GramDisplay label="Fat" value={macroGrams.fat} color={MACRO_COLORS.fat} icon={Droplets} total={macroGrams.protein + macroGrams.carbs + macroGrams.fat} />
                            </CardContent>
                        </Card>
                        <Card className="border shadow-lg"><CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b p-4 sm:p-5 md:p-6">
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg"><PieChartIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />Visual Breakdown</CardTitle></CardHeader>
                            <CardContent className="p-4 sm:p-5 md:p-6">
                            <div className="h-[180px] sm:h-[200px] lg:h-[180px] xl:h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%"><PieChartComponent><Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={38} outerRadius={58} paddingAngle={4} label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''} labelLine={false}>{pieData.map((entry) => (<Cell key={entry.name} fill={entry.color} />))}</Pie><RechartsTooltip contentStyle={{backgroundColor: 'hsl(var(--background))',border: '1px solid hsl(var(--border))',borderRadius: '8px',padding: '6px 10px',fontSize: '12px',}} formatter={(value: number) => [`${value}%`, 'Percentage']}/></PieChartComponent></ResponsiveContainer></div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-3">
                        <Accordion type="multiple" defaultValue={["Vitamins", "Minerals"]} className="w-full space-y-4 md:space-y-6">
                           <MicronutrientSection
                              title="Minerals"
                              icon={<Atom />}
                              fields={microGoalFields.Minerals}
                              goals={microGoals}
                              onGoalChange={handleMicroGoalChange}
                            />
                            <MicronutrientSection
                              title="Vitamins"
                              icon={<Shield />}
                              fields={microGoalFields.Vitamins}
                              goals={microGoals}
                              onGoalChange={handleMicroGoalChange}
                            />
                        </Accordion>
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="profile" className="mt-6">
                <Card className="border shadow-lg overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b p-4 sm:p-5 md:p-6">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <User className="h-4 w-4 text-primary" />Your Goal Profile</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">These details help us calculate your recommended nutritional targets.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5 md:p-6">
                        <div className="space-y-6 max-w-2xl">
                            <div className="space-y-4">
                                <h3 className="font-medium text-muted-foreground">Physical Details</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Gender</Label>
                                        <Select value={profileData.gender} onValueChange={(v) => handleProfileFieldChange('gender', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="male">Male</SelectItem>
                                                <SelectItem value="female">Female</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="age">Age</Label>
                                        <Input id="age" type="number" value={profileData.age || ''} onChange={(e) => handleProfileFieldChange('age', Number(e.target.value))} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="height">Height (cm)</Label>
                                        <Input id="height" type="number" value={profileData.heightCm || ''} onChange={(e) => handleProfileFieldChange('heightCm', Number(e.target.value))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="weight">Weight (kg)</Label>
                                        <Input id="weight" type="number" value={profileData.weightKg || ''} onChange={(e) => handleProfileFieldChange('weightKg', Number(e.target.value))} />
                                    </div>
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-4">
                                <h3 className="font-medium text-muted-foreground">Health & Activity</h3>
                                <div className="space-y-2"><Label>Primary Goal</Label>
                                    <Select value={profileData.primaryGoal} onValueChange={(v) => handleProfileFieldChange('primaryGoal', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="lose-weight">Lose Weight</SelectItem>
                                            <SelectItem value="maintain-weight">Maintain Weight</SelectItem>
                                            <SelectItem value="gain-weight">Gain Weight</SelectItem>
                                            <SelectItem value="eat-healthier">Eat Healthier</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2"><Label>Activity Level</Label>
                                    <RadioGroup value={profileData.activityLevel} onValueChange={(v) => handleProfileFieldChange('activityLevel', v)} className="grid grid-cols-2 gap-2">
                                        {(['low', 'moderate', 'active', 'very-active'] as const).map(level => (
                                            <Label key={level} className="p-2 border rounded-md cursor-pointer hover:bg-accent has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary text-center text-xs transition-colors">
                                                <RadioGroupItem value={level} className="sr-only" />
                                                <span className="capitalize">{level.replace('-', ' ')}</span>
                                            </Label>
                                        ))}
                                    </RadioGroup>
                                </div>
                            </div>
                            <Separator />
                             <div className="space-y-4">
                                <h3 className="font-medium text-muted-foreground">Dietary Preferences</h3>
                                <Accordion type="multiple" defaultValue={['Common Diets']} className="w-full">
                                    {Object.entries(preferenceGroups).map(([groupName, preferences]) => (
                                    <AccordionItem value={groupName} key={groupName}>
                                        <AccordionTrigger className="font-semibold">{groupName}</AccordionTrigger>
                                        <AccordionContent>
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {preferences.map((pref) => (
                                            <Badge
                                                key={pref}
                                                onClick={() => handlePreferenceSelect(pref)}
                                                variant={profileData.dietaryPreferences.includes(pref) ? 'default' : 'secondary'}
                                                className={cn(
                                                "text-sm px-3 py-1 cursor-pointer transition-all hover:scale-105",
                                                profileData.dietaryPreferences.includes(pref) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                                                )}
                                            >
                                                {pref}
                                            </Badge>
                                            ))}
                                        </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                    ))}
                                </Accordion>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>

      </div>
      <div className="mt-8 border-t bg-background/95 p-3 backdrop-blur-sm md:sticky md:bottom-0 z-10">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
            <Button variant="outline" onClick={handleReset} disabled={isSaving} className="w-full sm:w-auto rounded-lg px-4 sm:px-6 h-10 sm:h-11 text-xs sm:text-sm border-2 hover:border-primary/50 transition-all">
              <RefreshCw className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />Reset to Recommended</Button>
            <Button onClick={handleSave} disabled={isSaving || !hasChanges} size="lg" className="w-full sm:w-auto rounded-lg px-5 sm:px-8 h-10 sm:h-11 text-xs sm:text-sm bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all">
              {isSaving ? (<Loader2 className="mr-2 h-4 w-4 animate-spin" />) : (<Save className="mr-2 h-4 w-4 shrink-0" />)}
              Save All Goals
              {hasChanges && <ChevronRight className="ml-1 sm:ml-2 h-4 w-4 shrink-0" />}
            </Button>
          </div>
          {!hasChanges && initialState && (
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground mt-2">
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 shrink-0" />
              <span>All goals are up to date</span>
            </div>
          )}
      </div>
    </div>
  );
}

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

const MicronutrientSection: FC<{
  title: React.ReactNode;
  icon: React.ReactNode;
  fields: readonly MicronutrientKey[];
  goals: MicroGoalState;
  onGoalChange: (field: keyof MicroGoalState, value: string) => void;
}> = ({ title, icon, fields, goals, onGoalChange }) => {
    const goalKeys = useMemo(() => fields.map(field => {
        const key = NUTRIENT_GOAL_KEYS.find(k => {
          // Normalize both keys for comparison: remove "Target" and unit suffix, and make lowercase
          const normalizedK = k.replace(/Target(G|Mg|Mcg)$/i, '').toLowerCase();
          const normalizedField = field.toLowerCase();
          return normalizedK === normalizedField;
        });
        return key;
    }).filter((key): key is keyof MicroGoalState => !!key), [fields]);


    return (
        <Card className="border-2 shadow-lg overflow-hidden">
            <AccordionItem value={title as string} className="border-b-0">
                <AccordionTrigger className="p-4 sm:p-5 md:p-6 hover:no-underline">
                    <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                        {icon} {title}
                    </CardTitle>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                        {goalKeys.map(field => (
                           <MicroGoalInput
                             key={field}
                             field={field}
                             value={goals[field]}
                             onChange={onGoalChange}
                           />
                        ))}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Card>
    )
}

const MicroGoalInput: FC<{
    field: keyof MicroGoalState;
    value: number | undefined;
    onChange: (field: keyof MicroGoalState, value: string) => void;
}> = ({ field, value, onChange }) => {
    const nutrientKey = field.replace(/Target(G|Mg|Mcg)$/i, '') as MicronutrientKey;
    const label = NUTRIENT_LABELS[nutrientKey];
    const unit = NUTRIENT_UNITS[nutrientKey];
    const description = NUTRIENT_DESCRIPTIONS[nutrientKey];

    return (
        <div className="space-y-1.5">
            <div className="flex items-center gap-1">
                <Label htmlFor={field} className="text-sm">{label}</Label>
                {description && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button type="button" className="focus:outline-none">
                                    <Info className="h-3 w-3 text-muted-foreground" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-xs">{description}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>
            <div className="relative flex items-center">
                <Input
                    id={field}
                    type="number"
                    value={value || ''}
                    onChange={(e) => onChange(field, e.target.value)}
                    className="pr-12"
                />
                <span className="absolute right-3 text-sm text-muted-foreground pointer-events-none">{unit}</span>
            </div>
        </div>
    )
}


const GoalsSkeleton = () => (
  <div className="pb-8 md:pb-12 animate-pulse">
    <div className="w-full max-w-7xl mx-auto space-y-4 md:space-y-8">
      <div className="space-y-3 md:space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 md:h-16 md:w-16 rounded-2xl" />
          <div className="flex-1">
            <Skeleton className="h-8 md:h-10 w-56 md:w-64 mb-1.5" />
            <Skeleton className="h-4 md:h-5 w-72 md:w-96" />
          </div>
        </div>
      </div>

      <Skeleton className="h-12 w-full rounded-lg" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mt-6">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <Skeleton className="h-40 md:h-48 w-full rounded-xl" />
          <Skeleton className="h-64 md:h-80 w-full rounded-xl" />
        </div>
        <div className="space-y-4 md:space-y-6">
          <Skeleton className="h-56 md:h-64 w-full rounded-xl" />
          <Skeleton className="h-48 md:h-56 w-full rounded-xl" />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6">
        <Skeleton className="h-11 w-48 rounded-lg" />
        <Skeleton className="h-11 w-36 rounded-lg" />
      </div>
    </div>
  </div>
);

    