
'use client';

import { useEffect, useState, useMemo, type FC } from 'react';
import { TransitionLink } from '@/components/shared/transition-link';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, orderBy, limit, setDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { getAnalyticsData } from '@/services/analyticsService';
import type { DailyLog, AnalyticsData } from '@/types/analytics';
import type { GeneratedRecommendations, RecommendationItem } from '@/types/recommendations';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Cell, RadialBarChart, RadialBar, PolarAngleAxis, AreaChart, Area } from 'recharts';
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
  Utensils,
  ClipboardX,
  Plus,
  Minus,
  GlassWater,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { generateDailyRecommendations, type GenerateDailyRecommendationsOutput } from '@/ai/flows/generate-daily-recommendations';
import { AiCoachCard } from '@/components/overview/ai-coach-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { QuickAddMealModal } from '@/components/tracker/quick-add-meal-modal';
import { MICRONUTRIENT_KEYS, NUTRIENT_GOAL_KEYS, NUTRIENT_LABELS, NUTRIENT_UNITS, NUTRIENT_DRV } from '@/lib/nutrients';
import { errorEmitter, FirestorePermissionError } from '@/firebase';

const barColors = ['#3B82F6', '#22C55E', '#EAB308', '#EF4444', '#8B5CF6', '#F97316', '#14B8A6'];

const OverviewPage = () => {
  const { user, userProfile, isProfileLoading } = useUser();
  const db = useFirestore();

  const [weeklyData, setWeeklyData] = useState<AnalyticsData[] | null>(null);
  const [isWeeklyLoading, setIsWeeklyLoading] = useState(true);
  const [coachData, setCoachData] = useState<GenerateDailyRecommendationsOutput | null>(null);
  const [isCoachLoading, setIsCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);
  const [isAddMealModalOpen, setIsAddMealModalOpen] = useState(false);
  const [todayKey, setTodayKey] = useState('');

  useEffect(() => {
    setTodayKey(format(new Date(), 'yyyy-MM-dd'));
  }, []);

  const dailyLogRef = useMemoFirebase(
    () => (user && todayKey ? doc(db, 'users', user.uid, 'dailyLogs', todayKey) : null),
    [user, db, todayKey]
  );
  const { data: dailyLog, isLoading: isLogLoading } = useDoc<DailyLog>(dailyLogRef);

  useEffect(() => {
    if (user && db) {
      setIsWeeklyLoading(true);
      getAnalyticsData(db, user.uid, '7d')
        .then((data) => {
          setWeeklyData(data.chartData);
        })
        .finally(() => setIsWeeklyLoading(false));
    }
  }, [user, db, dailyLog]); // Re-fetch analytics when dailyLog changes for water chart

  const recommendationsQuery = useMemoFirebase(
    () =>
      user
        ? query(
            collection(db, 'users', user.uid, 'generatedRecommendations'),
            orderBy('createdAt', 'desc'),
            limit(1)
          )
        : null,
    [user, db]
  );
  const { data: recommendationsData, isLoading: isRecsLoading } =
    useCollection<GeneratedRecommendations>(recommendationsQuery);
  const latestRecs = useMemo(
    () => recommendationsData?.[0]?.recommendations || [],
    [recommendationsData]
  );

  const isLoading = isProfileLoading || isLogLoading || isWeeklyLoading || isRecsLoading;

  const userGoals = userProfile?.goals || {
    dailyCalorieGoal: 2000,
    proteinPercentageGoal: 30,
    carbsPercentageGoal: 40,
    fatPercentageGoal: 30,
  };
  const derivedGoals = {
    calories: userGoals.dailyCalorieGoal,
    protein: (userGoals.dailyCalorieGoal * (userGoals.proteinPercentageGoal / 100)) / 4,
    carbs: (userGoals.dailyCalorieGoal * (userGoals.carbsPercentageGoal / 100)) / 4,
    fat: (userGoals.dailyCalorieGoal * (userGoals.fatPercentageGoal / 100)) / 9,
    water: 8,
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
    meals: { Breakfast: [], Lunch: [], Dinner: [] },
  };
  
  const handleWaterChange = (newIntake: number) => {
    if (!dailyLogRef) return;
    const newLogData = {
      ...todayTotals,
      waterIntake: newIntake,
      date: todayKey,
    };
    setDoc(dailyLogRef, newLogData, { merge: true }).catch(error => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: dailyLogRef.path,
        operation: 'write',
        requestResourceData: { waterIntake: newIntake },
      }));
    });
  };

  const calorieProgress = (todayTotals.totalCalories / (derivedGoals.calories || 1)) * 100;
  const calorieRemaining = derivedGoals.calories - todayTotals.totalCalories;
  const isOverGoal = todayTotals.totalCalories > derivedGoals.calories;

  const topMicronutrients = useMemo(() => {
    if (!userProfile) return [];

    const goals = userProfile.goals || {};

    const allMicros = MICRONUTRIENT_KEYS.map(key => {
      const goalKey = NUTRIENT_GOAL_KEYS.find(k => k.toLowerCase().startsWith(key.toLowerCase()));
      const goal = (goals as any)[goalKey as any] || NUTRIENT_DRV[key] || 0;
      const totalKey = `total${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof DailyLog;
      const total = (todayTotals as any)[totalKey] || 0;
      
      const percentage = goal > 0 ? (total / goal) * 100 : 0;

      return {
        key,
        label: NUTRIENT_LABELS[key],
        value: total,
        goal,
        unit: NUTRIENT_UNITS[key],
        percentage,
      };
    });

    return allMicros
      .filter(m => m.goal > 0)
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 10);

  }, [todayTotals, userProfile]);

  const handleGetCoachPlan = async () => {
    if (!userProfile || !dailyLog) {
      setCoachError('Please log at least one meal today to get a coaching plan.');
      return;
    }
    if (!userProfile.goals || !userProfile.health) {
      setCoachError('Please complete your profile and set your goals first.');
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
      setCoachError(err.message || 'Failed to get recommendations from the AI coach.');
    } finally {
      setIsCoachLoading(false);
    }
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <>
    <div className="min-h-dvh bg-gradient-to-b from-background to-secondary/5">
      {/* Constrained, padded container scales across all viewports */}
      <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="shrink-0 p-2 sm:p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-h1 font-bold text-primary truncate">
                Dashboard Overview
              </h1>
              <p className="text-body text-muted-foreground flex items-center gap-1 mt-0.5">
                <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                <span className="truncate">{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="shrink-0 rounded-full px-3 py-1 text-xs sm:text-sm whitespace-nowrap self-start sm:self-auto"
          >
            <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5 text-primary" />
            Your daily snapshot
          </Badge>
        </div>

        {/* ── Main Grid ── */}
        <div className="grid gap-4 sm:gap-5 md:gap-6 md:grid-cols-2 lg:grid-cols-3">

          {/* ── Left / Main Column ── */}
          <div className="md:col-span-1 lg:col-span-2 space-y-4 sm:space-y-5 md:space-y-6">

            {/* Today's Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.05 }}
            >
              <Card className="border-2 shadow-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b pb-3 sm:pb-4">
                  <div className="flex items-start sm:items-center justify-between gap-2 flex-wrap">
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
                      <Badge
                        className={cn(
                          'shrink-0 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-xs',
                          isOverGoal
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-green-500/10 text-green-600'
                        )}
                      >
                        {isOverGoal ? 'Over goal' : 'On track'}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-3 sm:p-4 md:p-5 space-y-4 sm:space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5 items-center">
                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline gap-2 flex-wrap">
                        <span className="font-medium flex items-center gap-1.5 text-sm sm:text-base">
                          <div className="shrink-0 p-1 rounded-full bg-orange-500/10">
                            <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
                          </div>
                          Calories
                        </span>
                        <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap tabular-nums">
                          {todayTotals.totalCalories.toFixed(0)} / {derivedGoals.calories.toFixed(0)} kcal
                        </span>
                      </div>
                      <Progress
                        value={calorieProgress}
                        className="h-2.5"
                        indicatorClassName="bg-orange-500"
                      />
                    </div>
                    <div className="flex items-center sm:block sm:text-center sm:border-l sm:pl-5 py-1">
                      <p className="text-xs sm:text-sm text-muted-foreground mr-3 sm:mr-0 sm:mb-1">Remaining</p>
                      <p
                        className={cn(
                          'text-3xl sm:text-4xl font-bold tabular-nums leading-none',
                          calorieRemaining < 0 ? 'text-destructive' : 'text-primary'
                        )}
                      >
                        {Math.round(calorieRemaining)}
                      </p>
                      <p className="text-xs text-muted-foreground sm:mt-1 ml-1 sm:ml-0">kcal left</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3 sm:pt-4 border-t">
                    <MacroStat
                      icon={<Beef className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" />}
                      label="Protein"
                      value={todayTotals.totalProtein}
                      goal={derivedGoals.protein}
                      color="bg-red-500"
                    />
                    <MacroStat
                      icon={<Wheat className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-600" />}
                      label="Carbs"
                      value={todayTotals.totalCarbs}
                      goal={derivedGoals.carbs}
                      color="bg-yellow-600"
                    />
                    <MacroStat
                      icon={<Droplets className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />}
                      label="Fat"
                      value={todayTotals.totalFat}
                      goal={derivedGoals.fat}
                      color="bg-blue-500"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              <MicroNutrientGrid topNutrients={topMicronutrients} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.15 }}
            >
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
                <CardContent className="p-3 sm:p-4 md:p-5">
                  <div className="h-[180px] sm:h-[210px] md:h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(val) => format(new Date(val), 'EEE')}
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          width={36}
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
                          cursor={{ fill: 'hsl(var(--accent))', fillOpacity: 0.1, radius: 4 }}
                        />
                        <ReferenceLine
                          y={derivedGoals.calories}
                          label={{
                            value: 'Goal',
                            position: 'insideTopLeft',
                            fontSize: 10,
                            fill: 'hsl(var(--muted-foreground))',
                          }}
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
                            <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* ── Right / Sidebar Column ── */}
          <div className="md:col-span-1 lg:col-span-1 space-y-4 sm:space-y-5 md:space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.2 }}
            >
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
                    onClick={() => setIsAddMealModalOpen(true)}
                    className="min-h-[44px] h-12 sm:h-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md hover:shadow-lg transition-all"
                  >
                    <PlusCircle className="mr-1.5 sm:mr-2 h-4 w-4 shrink-0" />
                    <span className="text-xs sm:text-sm">Add Meal</span>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="min-h-[44px] h-12 sm:h-14 rounded-xl border-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
                  >
                    <TransitionLink href="/dashboard/search">
                      <Search className="mr-1.5 sm:mr-2 h-4 w-4 shrink-0" />
                      <span className="text-xs sm:text-sm">Search</span>
                    </TransitionLink>
                  </Button>
                  <Button
                    asChild
                    variant="secondary"
                    className="col-span-2 min-h-[44px] h-12 sm:h-14 rounded-xl bg-secondary/50 hover:bg-secondary/70 transition-all"
                  >
                    <TransitionLink href="/dashboard/goals">
                      <Target className="mr-1.5 sm:mr-2 h-4 w-4 shrink-0" />
                      <span className="text-xs sm:text-sm">Update Goals</span>
                    </TransitionLink>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.3 }}
            >
              <WaterWidget 
                  todayLog={todayTotals}
                  weeklyData={weeklyData}
                  goal={derivedGoals.water}
                  onIntakeChange={handleWaterChange}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.25 }}
            >
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
                    <RecommendationSkeleton />
                  ) : latestRecs.length > 0 ? (
                    <div className="space-y-2 sm:space-y-3">
                      {latestRecs.slice(0, 2).map((rec) => (
                        <RecommendationItemPreview key={rec.foodId} rec={rec} />
                      ))}
                      <Button
                        asChild
                        variant="secondary"
                        className="w-full mt-2 rounded-xl min-h-[44px] h-11 text-xs sm:text-sm"
                      >
                        <TransitionLink href="/dashboard/recommendations">
                          View All Recommendations
                          <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
                        </TransitionLink>
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-5 sm:py-6 space-y-2 sm:space-y-3">
                      <div className="inline-flex p-3 rounded-full bg-primary/10">
                        <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6 text-primary/50" />
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        No recommendations yet. Generate them on the Recommendations page!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

          </div>
        </div>

        <div className="mt-4 sm:mt-5 md:mt-6">
          {isCoachLoading ? (
            <Card className="border-2 shadow-xl overflow-hidden">
              <CardContent className="p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
                  <Loader2 className="h-10 w-10 text-primary animate-spin relative" />
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
              <AlertDescription className="text-sm">{coachError}</AlertDescription>
            </Alert>
          ) : coachData ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <AiCoachCard data={coachData} />
            </motion.div>
          ) : (
            <Card className="border-2 border-dashed shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-5 sm:p-6 md:p-8 text-center">
                <div className="mx-auto h-14 w-14 sm:h-16 sm:w-16 flex items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mb-3 sm:mb-4">
                  <BrainCircuit className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Need some guidance?</h3>
                <p className="text-muted-foreground text-xs sm:text-sm mb-5 sm:mb-6 max-w-md mx-auto">
                  Get personalized tips, meal ideas, and recipes for the rest of your day based on
                  your current progress.
                </p>
                <Button
                  onClick={handleGetCoachPlan}
                  size="lg"
                  className="rounded-xl px-6 sm:px-8 min-h-[44px] h-11 sm:h-12 text-sm sm:text-base bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                >
                  Ask AI Coach
                  <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

      </div>
    </div>
    <QuickAddMealModal isOpen={isAddMealModalOpen} onClose={() => setIsAddMealModalOpen(false)} />
    </>
  );
};

const MacroStat = ({ icon, label, value, goal, color,}: { icon: React.ReactNode; label: string; value: number; goal: number; color: string;}) => {
  const percentage = goal > 0 ? (value / goal) * 100 : 0;
  return (
    <motion.div whileHover={{ scale: 1.02 }} className="text-center p-2 sm:p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-1 sm:mb-2 flex-wrap">
        {icon}
        <span className="font-medium text-xs sm:text-sm">{label}</span>
      </div>
      <p className="text-lg sm:text-xl font-bold tabular-nums leading-none">{value.toFixed(0)}g</p>
      <div className="mt-1.5 sm:mt-2 space-y-0.5 sm:space-y-1">
        <Progress value={percentage} className="h-1 sm:h-1.5" indicatorClassName={color} />
        <p className="text-[10px] sm:text-xs text-muted-foreground tabular-nums">Goal: {goal.toFixed(0)}g</p>
      </div>
    </motion.div>
  );
};

const RecommendationItemPreview = ({ rec }: { rec: RecommendationItem }) => (
  <TransitionLink href={`/dashboard/food/${rec.foodId}`} className="block">
    <motion.div whileHover={{ x: 4 }} className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-primary/20 transition-all group">
      <div className="shrink-0 p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
        <Lightbulb className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-xs sm:text-sm truncate">{rec.name}</p>
        <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
          <span className="tabular-nums">{rec.calories.toFixed(0)} kcal</span>
          <span>•</span>
          <span className="truncate">{rec.reason.slice(0, 30)}...</span>
        </p>
      </div>
      <ArrowRight className="shrink-0 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
    </motion.div>
  </TransitionLink>
);

const NutrientProgress: FC<{ label: string; value: number; goal: number; unit: string; percentage: number;}> = ({ label, value, goal, unit, percentage }) => {
  const isComplete = percentage >= 100;
  return (
    <motion.div className="space-y-1.5 p-2.5 sm:p-3 rounded-lg bg-muted/30" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex justify-between items-center text-xs sm:text-sm">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className="font-bold">{percentage.toFixed(0)}%</span>
      </div>
      <Progress value={Math.min(percentage, 100)} className="h-1.5" indicatorClassName={cn(isComplete ? "bg-green-500" : "bg-primary")} />
      <div className="text-right text-[10px] text-muted-foreground/80 tabular-nums">{value.toFixed(1)}{unit} / {goal.toFixed(1)}{unit}</div>
    </motion.div>
  );
};

const MicroNutrientGrid: FC<{ topNutrients: Array<{ key: string; label: string; value: number; goal: number; unit: string; percentage: number; }> }> = ({ topNutrients }) => (
  <Card className="border-2 shadow-xl overflow-hidden">
    <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b pb-3 sm:pb-4">
      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
        <div className="shrink-0 p-1.5 rounded-lg bg-primary/10">
          <Salad className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
        </div>
        Top 10 Micronutrients
      </CardTitle>
      <CardDescription className="text-xs sm:text-sm">Today's highest progress against your daily goals.</CardDescription>
    </CardHeader>
    <CardContent className="p-3 sm:p-4">
      {topNutrients.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
          {topNutrients.map(nutrient => (
            <NutrientProgress key={nutrient.key} label={nutrient.label} value={nutrient.value} goal={nutrient.goal} unit={nutrient.unit} percentage={nutrient.percentage} />
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
            <div className="inline-flex p-3 sm:p-4 rounded-full bg-muted/50 mb-3">
              <ClipboardX className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">Log a meal to see your nutrient progress.</p>
          </div>
      )}
    </CardContent>
  </Card>
);

const WaterWidget: FC<{ todayLog: DailyLog; weeklyData: AnalyticsData[] | null; goal: number; onIntakeChange: (newIntake: number) => void; }> = ({ todayLog, weeklyData, goal, onIntakeChange }) => {
  const intake = todayLog.waterIntake;
  const progress = Math.min((intake / goal) * 100, 100);
  const isGoalMet = intake >= goal;
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    if (isGoalMet) {
      setShowCheck(true);
      const timer = setTimeout(() => setShowCheck(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isGoalMet]);

  const chartData = useMemo(() => weeklyData?.map(d => ({ date: format(new Date(d.date), 'EEE'), intake: d.waterIntake, goal })) || [], [weeklyData, goal]);

  return (
    <Card className="border-2 shadow-xl overflow-hidden bg-gradient-to-br from-blue-500/5 to-transparent">
      <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base sm:text-lg text-blue-600 dark:text-blue-400">
        <div className="p-1.5 rounded-lg bg-blue-500/10"><GlassWater className="h-4 w-4" /></div>Hydration</CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => onIntakeChange(Math.max(0, intake - 1))} disabled={intake === 0} className="h-12 w-12 rounded-full border-2 bg-background/50 hover:bg-muted active:bg-muted/80 disabled:opacity-50 transition-all flex items-center justify-center"><Minus className="h-5 w-5" /></motion.button>
          <div className="relative h-28 w-28">
            <AnimatePresence>{showCheck && (<motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }} className="absolute inset-0 flex items-center justify-center z-10"><div className="h-10 w-10 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg"><CheckCircle2 className="h-6 w-6" /></div></motion.div>)}</AnimatePresence>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="75%" outerRadius="100%" barSize={10} data={[{ name: 'intake', value: progress }]} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background dataKey="value" angleAxisId={0} fill={isGoalMet ? 'hsl(142.1 76.2% 41.2%)' : 'hsl(217.2 91.2% 59.8%)'} cornerRadius="50%" className="transition-colors"/>
                <circle cx="50%" cy="50%" r="65%" fill="hsl(var(--background))" />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center"><span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{intake}</span><span className="text-sm text-muted-foreground">/ {goal}</span></div>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => onIntakeChange(intake + 1)} className="h-12 w-12 rounded-full border-2 bg-background/50 hover:bg-muted active:bg-muted/80 transition-all flex items-center justify-center"><Plus className="h-5 w-5" /></motion.button>
        </div>
        <div className="h-[80px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs><linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(217.2 91.2% 59.8%)" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(217.2 91.2% 59.8%)" stopOpacity={0}/></linearGradient></defs>
              <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={10} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ display: 'none' }} cursor={{ fill: 'hsl(var(--accent))', opacity: 0.2 }} />
              <ReferenceLine y={goal} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <Area type="monotone" dataKey="intake" stroke="hsl(217.2 91.2% 59.8%)" fill="url(#waterGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
};


const RecommendationSkeleton = () => (
  <div className="space-y-3">
    {[1, 2].map((i) => (
      <div key={i} className="flex items-center gap-3 p-3">
        <Skeleton className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 sm:h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
    ))}
  </div>
);

const DashboardSkeleton = () => (
  <div className="min-h-dvh bg-gradient-to-b from-background to-secondary/5 pb-8 animate-pulse">
    <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl" />
          <div>
            <Skeleton className="h-6 sm:h-8 w-40 sm:w-52 mb-1.5 sm:mb-2" />
            <Skeleton className="h-3.5 sm:h-4 w-52 sm:w-64" />
          </div>
        </div>
        <Skeleton className="h-7 sm:h-8 w-28 sm:w-32 rounded-full" />
      </div>
      <div className="grid gap-4 sm:gap-5 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-1 lg:col-span-2 space-y-4 sm:space-y-5 md:space-y-6">
          <Card className="border-2"><CardHeader><Skeleton className="h-5 sm:h-6 w-36 sm:w-44" /><Skeleton className="h-3.5 sm:h-4 w-48 sm:w-56 mt-2" /></CardHeader><CardContent className="p-4 sm:p-5 space-y-5"><div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center"><Skeleton className="h-14 sm:h-16 w-full" /><Skeleton className="h-14 sm:h-16 w-full" /></div><div className="grid grid-cols-3 gap-2 sm:gap-3 pt-4 border-t"><Skeleton className="h-18 sm:h-20 w-full rounded-xl" /><Skeleton className="h-18 sm:h-20 w-full rounded-xl" /><Skeleton className="h-18 sm:h-20 w-full rounded-xl" /></div></CardContent></Card>
          <Skeleton className="h-40 sm:h-48 w-full rounded-xl" />
          <Skeleton className="h-56 sm:h-64 w-full rounded-xl" />
        </div>
        <div className="md:col-span-1 space-y-4 sm:space-y-5 md:space-y-6">
          <Skeleton className="h-40 sm:h-48 w-full rounded-xl" />
          <Skeleton className="h-40 sm:h-48 w-full rounded-xl" />
          <Skeleton className="h-28 sm:h-32 w-full rounded-xl" />
        </div>
      </div>
      <Skeleton className="h-36 sm:h-40 w-full rounded-xl" />
    </div>
  </div>
);

export default OverviewPage;
