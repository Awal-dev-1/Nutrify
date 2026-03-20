'use client';

import { useEffect, useState, useMemo, type FC } from 'react';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, orderBy, limit } from 'firebase/firestore';
import { format } from 'date-fns';
import { getAnalyticsData } from '@/services/analyticsService';
import type { DailyLog, AnalyticsData } from '@/types/analytics';
import type { GeneratedRecommendations, RecommendationItem } from '@/types/recommendations';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Flame, 
  Beef, 
  Wheat, 
  Droplets, 
  PlusCircle, 
  Search, 
  Target, 
  Lightbulb, 
  ArrowRight, 
  BrainCircuit, 
  Loader2, 
  AlertCircle,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Sparkles,
  Clock,
  Coffee,
  Salad,
  Utensils
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { generateDailyRecommendations, type GenerateDailyRecommendationsOutput } from '@/ai/flows/generate-daily-recommendations';
import { AiCoachCard } from '@/components/overview/ai-coach-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const OverviewPage = () => {
  const { user, userProfile, isProfileLoading } = useUser();
  const db = useFirestore();

  const [weeklyData, setWeeklyData] = useState<AnalyticsData[] | null>(null);
  const [isWeeklyLoading, setIsWeeklyLoading] = useState(true);
  const [coachData, setCoachData] = useState<GenerateDailyRecommendationsOutput | null>(null);
  const [isCoachLoading, setIsCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const dailyLogRef = useMemoFirebase(
    () => (user ? doc(db, 'users', user.uid, 'dailyLogs', todayKey) : null),
    [user, db, todayKey]
  );
  const { data: dailyLog, isLoading: isLogLoading } = useDoc<DailyLog>(dailyLogRef);

  useEffect(() => {
    if (user && db) {
      setIsWeeklyLoading(true);
      getAnalyticsData(db, user.uid, '7d')
        .then(data => {
          setWeeklyData(data.chartData);
        })
        .finally(() => setIsWeeklyLoading(false));
    }
  }, [user, db]);

  const recommendationsQuery = useMemoFirebase(
    () => user ? query(collection(db, 'users', user.uid, 'generatedRecommendations'), orderBy('createdAt', 'desc'), limit(1)) : null,
    [user, db]
  );
  const { data: recommendationsData, isLoading: isRecsLoading } = useCollection<GeneratedRecommendations>(recommendationsQuery);
  const latestRecs = useMemo(() => recommendationsData?.[0]?.recommendations || [], [recommendationsData]);

  const isLoading = isProfileLoading || isLogLoading || isWeeklyLoading || isRecsLoading;
  
  const userGoals = userProfile?.goals || { dailyCalorieGoal: 2000, proteinPercentageGoal: 30, carbsPercentageGoal: 40, fatPercentageGoal: 30 };
  const derivedGoals = {
    calories: userGoals.dailyCalorieGoal,
    protein: (userGoals.dailyCalorieGoal * (userGoals.proteinPercentageGoal / 100)) / 4,
    carbs: (userGoals.dailyCalorieGoal * (userGoals.carbsPercentageGoal / 100)) / 4,
    fat: (userGoals.dailyCalorieGoal * (userGoals.fatPercentageGoal / 100)) / 9,
  };

  const todayTotals: DailyLog = dailyLog || { 
    date: todayKey,
    totalCalories: 0, 
    totalProtein: 0, 
    totalCarbs: 0, 
    totalFat: 0,
    totalIron: 0, 
    totalVitaminA: 0, 
    totalSodium: 0, 
    totalFiber: 0,
    totalSugar: 0, 
    totalCalcium: 0, 
    totalVitaminC: 0,
    waterIntake: 0,
    meals: { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] },
  };
  
  const calorieProgress = (todayTotals.totalCalories / (derivedGoals.calories || 1)) * 100;
  const calorieRemaining = derivedGoals.calories - todayTotals.totalCalories;
  const isOverGoal = todayTotals.totalCalories > derivedGoals.calories;

  const handleGetCoachPlan = async () => {
    if (!userProfile || !dailyLog) {
        setCoachError("Please log at least one meal today to get a coaching plan.");
        return;
    }
    if (!userProfile.goals || !userProfile.health) {
        setCoachError("Please complete your profile and set your goals first.");
        return;
    }
    setIsCoachLoading(true);
    setCoachError(null);
    setCoachData(null);
    try {
        const input = {
            calorieTarget: userProfile.goals.dailyCalorieGoal,
            caloriesConsumed: dailyLog.totalCalories,
            goals: userProfile.health.primaryGoal,
            preferences: userProfile.health.dietaryPreferences || [],
        };
        const result = await generateDailyRecommendations(input);
        setCoachData(result);
    } catch (err: any) {
        console.error(err);
        setCoachError(err.message || "Failed to get recommendations from the AI coach.");
    } finally {
        setIsCoachLoading(false);
    }
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/5 pb-8">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8 space-y-4 md:space-y-6 lg:space-y-8">

        {/* Header */}
        <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="shrink-0 p-2 sm:p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent truncate">
                Dashboard Overview
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                <span className="truncate">{format(new Date(), "EEEE, MMMM d, yyyy")}</span>
              </p>
            </div>
          </div>
          <Badge variant="outline" className="shrink-0 rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm whitespace-nowrap">
            <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5 text-primary" />
            Your daily snapshot
          </Badge>
        </div>

        {/* Main Grid: stacks on mobile, side-by-side on lg+ */}
        <div className="grid gap-4 md:gap-6 lg:grid-cols-3">

          {/* ── Left Column ── */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">

            {/* Today's Summary */}
            <Card className="border-2 shadow-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b pb-3 sm:pb-4">
                <div className="flex items-start sm:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
                      <div className="shrink-0 p-1 sm:p-1.5 rounded-lg bg-primary/10">
                        <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                      </div>
                      Today's Summary
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm mt-0.5">
                      Your real-time progress towards today's goals
                    </CardDescription>
                  </div>
                  {todayTotals.totalCalories > 0 && (
                    <Badge className={cn(
                      "shrink-0 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-xs",
                      isOverGoal ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-600"
                    )}>
                      {isOverGoal ? "Over goal" : "On track"}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
                {/* Calories row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-center">
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="font-medium flex items-center gap-1.5 text-sm sm:text-base">
                        <div className="shrink-0 p-1 rounded-full bg-orange-500/10">
                          <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
                        </div>
                        Calories
                      </span>
                      <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                        {todayTotals.totalCalories.toFixed(0)} / {derivedGoals.calories.toFixed(0)} kcal
                      </span>
                    </div>
                    <Progress value={calorieProgress} className="h-2 sm:h-2.5" />
                  </div>
                  <div className="text-center sm:border-l sm:pl-6 py-1 sm:py-2">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Remaining</p>
                    <p className={cn(
                      "text-3xl sm:text-4xl font-bold",
                      calorieRemaining < 0 ? "text-destructive" : "text-primary"
                    )}>
                      {Math.round(calorieRemaining)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">kcal left</p>
                  </div>
                </div>

                {/* Macros */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 pt-3 sm:pt-4 border-t">
                  <MacroStat 
                    icon={<Beef className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" />} 
                    label="Protein" 
                    value={todayTotals.totalProtein} 
                    goal={derivedGoals.protein} 
                  />
                  <MacroStat 
                    icon={<Wheat className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-600" />} 
                    label="Carbs" 
                    value={todayTotals.totalCarbs} 
                    goal={derivedGoals.carbs} 
                  />
                  <MacroStat 
                    icon={<Droplets className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />} 
                    label="Fat" 
                    value={todayTotals.totalFat} 
                    goal={derivedGoals.fat} 
                  />
                </div>
              </CardContent>
            </Card>

            <MicroNutrientGrid totals={todayTotals} />

            {/* Weekly Trend */}
            <Card className="border-2 shadow-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
                  <div className="shrink-0 p-1 sm:p-1.5 rounded-lg bg-primary/10">
                    <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  </div>
                  Weekly Calorie Trend
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Your calorie intake over the last 7 days
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="h-[200px] sm:h-[230px] md:h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(val) => format(new Date(val), 'EEE')} 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false}
                        width={40}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                          padding: '8px 12px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          fontSize: '12px',
                        }}
                        labelFormatter={(label) => format(new Date(label), 'MMMM d, yyyy')}
                        formatter={(value: number) => [`${Math.round(value)} kcal`, 'Calories']}
                      />
                      <ReferenceLine 
                        y={derivedGoals.calories} 
                        label={{ value: 'Goal', position: 'insideTopLeft', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
                        stroke="hsl(var(--destructive))" 
                        strokeDasharray="3 3" 
                      />
                      <Bar 
                        dataKey="calories"
                        radius={[4, 4, 0, 0]} 
                        maxBarSize={40}
                        animationDuration={500}
                      >
                         {weeklyData?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.calories > entry.goal ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Right Column ── */}
          {/* On mobile/tablet, this stacks below left column. On lg+, sits beside. */}
          <div className="lg:col-span-1 space-y-4 md:space-y-6">

            {/* Quick Actions */}
            <Card className="border-2 shadow-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="shrink-0 p-1 sm:p-1.5 rounded-lg bg-primary/10">
                    <Utensils className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  </div>
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 grid grid-cols-2 gap-2 sm:gap-3">
                <Button 
                  asChild 
                  className="h-12 sm:h-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md hover:shadow-lg transition-all"
                >
                  <Link href="/dashboard/tracker">
                    <PlusCircle className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" /> 
                    <span className="text-xs sm:text-sm">Add Meal</span>
                  </Link>
                </Button>
                <Button 
                  asChild 
                  variant="outline" 
                  className="h-12 sm:h-14 rounded-xl border-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <Link href="/dashboard/search">
                    <Search className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" /> 
                    <span className="text-xs sm:text-sm">Search</span>
                  </Link>
                </Button>
                <Button 
                  asChild 
                  variant="secondary" 
                  className="col-span-2 h-12 sm:h-14 rounded-xl bg-secondary/50 hover:bg-secondary/70 transition-all"
                >
                  <Link href="/dashboard/goals">
                    <Target className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" /> 
                    <span className="text-xs sm:text-sm">Update Goals</span>
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Smart Suggestions */}
            <Card className="border-2 shadow-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="shrink-0 p-1 sm:p-1.5 rounded-lg bg-primary/10">
                    <Lightbulb className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  </div>
                  Smart Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4">
                {isRecsLoading ? (
                  <RecommendationSkeleton/>
                ) : latestRecs.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {latestRecs.slice(0, 2).map((rec) => (
                      <RecommendationItemPreview key={rec.foodId} rec={rec} />
                    ))}
                    <Button 
                      asChild 
                      variant="secondary" 
                      className="w-full mt-2 rounded-xl h-10 sm:h-11 text-xs sm:text-sm"
                    >
                      <Link href="/dashboard/recommendations">
                        View All Recommendations
                        <ArrowRight className="ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4 sm:py-6 space-y-2 sm:space-y-3">
                    <div className="inline-flex p-2.5 sm:p-3 rounded-full bg-primary/10">
                      <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6 text-primary/50" />
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      No recommendations yet. Generate them on the Recommendations page!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Hydration Tip */}
            <Card className="border-2 shadow-xl overflow-hidden bg-gradient-to-br from-blue-500/5 to-blue-500/10 dark:from-blue-500/10 dark:to-blue-500/5">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-blue-600 dark:text-blue-400">
                  <div className="shrink-0 p-1 sm:p-1.5 rounded-lg bg-blue-500/10">
                    <Droplets className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  Hydration Tip
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                  Drinking water before a meal can help with digestion and make you feel fuller, preventing overeating.
                </p>
                <div className="mt-2 sm:mt-3 flex items-center gap-1.5 sm:gap-2 text-xs text-blue-600/70 dark:text-blue-400/70">
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                  <span>8 glasses recommended daily</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI Daily Coach Section */}
        <div className="mt-4 sm:mt-6">
          {isCoachLoading ? (
            <Card className="border-2 shadow-xl overflow-hidden">
              <CardContent className="p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-3 sm:space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse"></div>
                  <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 text-primary animate-spin relative" />
                </div>
                <div>
                  <p className="text-sm sm:text-base font-semibold">Your coach is thinking...</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">This may take a moment.</p>
                </div>
              </CardContent>
            </Card>
          ) : coachError ? (
            <Alert variant="destructive" className="border-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>AI Coach Error</AlertTitle>
              <AlertDescription>{coachError}</AlertDescription>
            </Alert>
          ) : coachData ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AiCoachCard data={coachData} />
            </motion.div>
          ) : (
            <Card className="border-2 border-dashed shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-6 sm:p-8 text-center">
                <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 flex items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mb-3 sm:mb-4">
                  <BrainCircuit className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-1.5 sm:mb-2">Need some guidance?</h3>
                <p className="text-muted-foreground text-xs sm:text-sm mb-4 sm:mb-6 max-w-xs sm:max-w-md mx-auto">
                  Get personalized tips, meal ideas, and recipes for the rest of your day based on your current progress.
                </p>
                <Button 
                  onClick={handleGetCoachPlan} 
                  size="lg"
                  className="rounded-xl px-6 sm:px-8 h-11 sm:h-12 text-sm sm:text-base bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                >
                  Ask AI Coach
                  <Sparkles className="ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
};

// MacroStat — always 3-column so each card is naturally compact on all sizes
const MacroStat = ({ icon, label, value, goal }: { icon: React.ReactNode, label: string, value: number, goal: number }) => {
  const percentage = goal > 0 ? (value / goal) * 100 : 0;
  
  return (
    <motion.div 
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="text-center p-2 sm:p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-1.5 sm:mb-2">
        {icon}
        <span className="font-medium text-xs sm:text-sm">{label}</span>
      </div>
      <p className="text-base sm:text-lg md:text-xl font-bold">{value.toFixed(0)}g</p>
      <div className="mt-1.5 sm:mt-2 space-y-1">
        <Progress value={percentage} className="h-1 sm:h-1.5" />
        <p className="text-xs text-muted-foreground">Goal: {goal.toFixed(0)}g</p>
      </div>
    </motion.div>
  );
};

// RecommendationItemPreview
const RecommendationItemPreview = ({ rec }: { rec: RecommendationItem }) => (
  <Link href={`/dashboard/food/${rec.foodId}`} className="block">
    <motion.div 
      whileHover={{ x: 4 }}
      className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-primary/20 transition-all group"
    >
      <div className="shrink-0 p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
        <Lightbulb className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-xs sm:text-sm truncate">{rec.name}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
          <span>{rec.calories.toFixed(0)} kcal</span>
          <span>•</span>
          <span className="truncate">{rec.reason.slice(0, 30)}...</span>
        </p>
      </div>
      <ArrowRight className="shrink-0 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
    </motion.div>
  </Link>
);

// MicroStat
const MicroStat: FC<{label:string, value:number, unit:string}> = ({ label, value, unit }) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border hover:shadow-md transition-all"
  >
    <p className="text-xs text-muted-foreground mb-0.5 sm:mb-1">{label}</p>
    <p className="text-base sm:text-lg font-bold">
      {Math.round(value)}
      <span className="text-xs sm:text-sm font-normal text-muted-foreground ml-0.5">{unit}</span>
    </p>
  </motion.div>
);

// MicroNutrientGrid
const MicroNutrientGrid: FC<{ totals: DailyLog }> = ({ totals }) => (
  <Card className="border-2 shadow-xl overflow-hidden">
    <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b pb-3 sm:pb-4">
      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
        <div className="shrink-0 p-1 sm:p-1.5 rounded-lg bg-primary/10">
          <Salad className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
        </div>
        Micronutrient Overview
      </CardTitle>
    </CardHeader>
    <CardContent className="p-3 sm:p-4 grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3">
      <MicroStat label="Fiber" value={totals.totalFiber} unit="g" />
      <MicroStat label="Sugar" value={totals.totalSugar} unit="g" />
      <MicroStat label="Sodium" value={totals.totalSodium} unit="mg" />
      <MicroStat label="Calcium" value={totals.totalCalcium} unit="mg" />
      <MicroStat label="Iron" value={totals.totalIron} unit="mg" />
      <MicroStat label="Vit. A" value={totals.totalVitaminA} unit="µg" />
    </CardContent>
  </Card>
);

// Skeletons
const RecommendationSkeleton = () => (
  <div className="space-y-2 sm:space-y-3">
    {[1, 2].map((i) => (
      <div key={i} className="flex items-center gap-3 p-3">
        <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg shrink-0" />
        <div className="flex-1 space-y-1.5 sm:space-y-2">
          <Skeleton className="h-3.5 sm:h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
    ))}
  </div>
);

const DashboardSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-b from-background to-secondary/5 pb-8">
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8 space-y-4 md:space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl" />
          <div>
            <Skeleton className="h-6 sm:h-8 w-36 sm:w-48 mb-1.5 sm:mb-2" />
            <Skeleton className="h-3.5 sm:h-4 w-24 sm:w-32" />
          </div>
        </div>
        <Skeleton className="h-7 sm:h-8 w-28 sm:w-32 rounded-full" />
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <Card className="border-2">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex justify-between">
                <div>
                  <Skeleton className="h-5 sm:h-6 w-32 sm:w-40" />
                  <Skeleton className="h-3.5 sm:h-4 w-44 sm:w-56 mt-1.5 sm:mt-2" />
                </div>
                <Skeleton className="h-5 sm:h-6 w-14 sm:w-16 rounded-full" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <Skeleton className="h-10 sm:h-12 w-full" />
                <Skeleton className="h-10 sm:h-12 w-full" />
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-3 sm:pt-4 border-t">
                <Skeleton className="h-20 sm:h-24 w-full rounded-xl" />
                <Skeleton className="h-20 sm:h-24 w-full rounded-xl" />
                <Skeleton className="h-20 sm:h-24 w-full rounded-xl" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-3 sm:pb-4">
              <Skeleton className="h-5 sm:h-6 w-40" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3">
              {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-14 sm:h-16 w-full rounded-xl" />)}
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-3 sm:pb-4">
              <Skeleton className="h-5 sm:h-6 w-40 sm:w-48" />
              <Skeleton className="h-3.5 sm:h-4 w-52 sm:w-64 mt-1.5 sm:mt-2" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <Skeleton className="h-[200px] sm:h-[250px] w-full rounded-xl" />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-4 md:space-y-6">
          <Card className="border-2">
            <CardHeader className="pb-3 sm:pb-4">
              <Skeleton className="h-5 sm:h-6 w-28 sm:w-32" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 grid grid-cols-2 gap-2 sm:gap-3">
              <Skeleton className="h-12 sm:h-14 w-full rounded-xl" />
              <Skeleton className="h-12 sm:h-14 w-full rounded-xl" />
              <Skeleton className="h-12 sm:h-14 w-full rounded-xl col-span-2" />
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-3 sm:pb-4">
              <Skeleton className="h-5 sm:h-6 w-36 sm:w-40" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <RecommendationSkeleton />
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-2 sm:pb-3">
              <Skeleton className="h-5 sm:h-6 w-28 sm:w-32" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <Skeleton className="h-14 sm:h-16 w-full rounded-xl" />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-2 border-dashed">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <Skeleton className="h-12 w-12 sm:h-16 sm:w-16 rounded-full mb-3 sm:mb-4" />
            <Skeleton className="h-6 sm:h-8 w-40 sm:w-48 mb-1.5 sm:mb-2" />
            <Skeleton className="h-3.5 sm:h-4 w-52 sm:w-64 mb-4 sm:mb-6" />
            <Skeleton className="h-10 sm:h-12 w-28 sm:w-32 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default OverviewPage;
