
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
  Sparkles,
  Clock,
  Utensils,
  Salad,
  Leaf,
  Shield,
  Eye,
  Cookie
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { generateDailyRecommendations, type GenerateDailyRecommendationsOutput } from '@/ai/flows/generate-daily-recommendations';
import { AiCoachCard } from '@/components/overview/ai-coach-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const barColors = ["#3B82F6", "#22C55E", "#EAB308", "#EF4444", "#8B5CF6", "#F97316", "#14B8A6"];

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
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8 space-y-6 md:space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="shrink-0 p-2 sm:p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent truncate">
                Dashboard Overview
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{format(new Date(), "EEEE, MMMM d, yyyy")}</span>
              </p>
            </div>
          </div>
          <Badge variant="outline" className="shrink-0 rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm whitespace-nowrap">
            <Sparkles className="h-3 w-3 sm:h-3.5 w-3.5 mr-1 sm:mr-1.5 text-primary" />
            Your daily snapshot
          </Badge>
        </div>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-5">

          {/* ── Left Column ── */}
          <div className="lg:col-span-3 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="border-2 shadow-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Clock className="h-4 w-4 text-primary" /> Today's Progress
                  </CardTitle>
                  <CardDescription className="text-sm">Your real-time progress towards today's goals.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Calories Consumed</p>
                    <div>
                      <span className="text-5xl font-bold text-primary">{todayTotals.totalCalories.toFixed(0)}</span>
                      <span className="text-xl text-muted-foreground"> / {derivedGoals.calories.toFixed(0)}</span>
                      <span className="text-sm text-muted-foreground"> kcal</span>
                    </div>
                  </div>
                  <Progress value={calorieProgress} className="h-2.5" indicatorClassName={isOverGoal ? 'bg-destructive' : 'bg-primary'} />
                  
                  <Separator />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <MacroStat 
                      icon={<Beef className="h-5 w-5 text-red-500" />} 
                      label="Protein" 
                      value={todayTotals.totalProtein} 
                      goal={derivedGoals.protein} 
                      color="bg-red-500"
                    />
                    <MacroStat 
                      icon={<Wheat className="h-5 w-5 text-yellow-600" />} 
                      label="Carbs" 
                      value={todayTotals.totalCarbs} 
                      goal={derivedGoals.carbs} 
                      color="bg-yellow-600"
                    />
                    <MacroStat 
                      icon={<Droplets className="h-5 w-5 text-blue-500" />} 
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
                transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="border-2 shadow-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <div className="shrink-0 p-1 sm:p-1.5 rounded-lg bg-primary/10">
                      <TrendingUp className="h-4 w-4 text-primary" />
                    </div>
                    Weekly Calorie Trend
                  </CardTitle>
                  <CardDescription className="text-sm">
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
                          cursor={{ fill: 'hsl(var(--accent))', fillOpacity: 0.1, radius: 4 }}
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

          {/* ── Right Column ── */}
          <div className="lg:col-span-2 space-y-6">

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="border-2 shadow-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Utensils className="h-4 w-4 text-primary" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 grid grid-cols-1 gap-2">
                  <Button asChild size="lg" className="h-14 justify-start rounded-xl text-base bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg">
                    <Link href="/dashboard/tracker">
                      <PlusCircle className="mr-3 h-5 w-5" />
                      Add to Today's Log
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="secondary" className="h-14 justify-start rounded-xl text-base">
                    <Link href="/dashboard/search">
                      <Search className="mr-3 h-5 w-5" />
                      Search for Foods
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="secondary" className="h-14 justify-start rounded-xl text-base">
                    <Link href="/dashboard/goals">
                      <Target className="mr-3 h-5 w-5" />
                      Update My Goals
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="border-2 shadow-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="shrink-0 p-1 sm:p-1.5 rounded-lg bg-primary/10">
                      <Lightbulb className="h-4 w-4 text-primary" />
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
                        className="w-full mt-2 rounded-xl h-11 text-sm"
                      >
                        <Link href="/dashboard/recommendations">
                          View All Recommendations
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4 sm:py-6 space-y-2 sm:space-y-3">
                      <div className="inline-flex p-3 rounded-full bg-primary/10">
                        <Lightbulb className="h-6 w-6 text-primary/50" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        No recommendations yet. Generate them on the Recommendations page!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
            >
              <MicroNutrientGrid totals={todayTotals} />
            </motion.div>
          </div>
        </div>

        {/* AI Daily Coach Section */}
        <div className="mt-6 md:mt-8">
          {isCoachLoading ? (
            <Card className="border-2 shadow-xl overflow-hidden">
              <CardContent className="p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse"></div>
                  <Loader2 className="h-10 w-10 text-primary animate-spin relative" />
                </div>
                <div>
                  <p className="text-base font-semibold">Your coach is thinking...</p>
                  <p className="text-sm text-muted-foreground mt-1">This may take a moment.</p>
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
                <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mb-4">
                  <BrainCircuit className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Need some guidance?</h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
                  Get personalized tips, meal ideas, and recipes for the rest of your day based on your current progress.
                </p>
                <Button 
                  onClick={handleGetCoachPlan} 
                  size="lg"
                  className="rounded-xl px-8 h-12 text-base bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
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
  );
};

const MacroStat: FC<{ icon: React.ReactNode, label: string, value: number, goal: number, color: string }> = ({ icon, label, value, goal, color }) => {
  const percentage = goal > 0 ? (value / goal) * 100 : 0;
  
  return (
    <div className="p-3 rounded-xl bg-muted/30 text-center">
      <div className="flex items-center justify-center gap-1.5 mb-2">
        {icon}
        <span className="font-semibold text-sm">{label}</span>
      </div>
      <p className="text-xl font-bold">{value.toFixed(0)}g</p>
      <div className="mt-2 space-y-1">
        <Progress value={percentage} className="h-1.5" indicatorClassName={color} />
        <p className="text-xs text-muted-foreground">Goal: {goal.toFixed(0)}g</p>
      </div>
    </div>
  );
};

const RecommendationItemPreview = ({ rec }: { rec: RecommendationItem }) => (
  <Link href={`/dashboard/food/${rec.foodId}`} className="block">
    <motion.div 
      whileHover={{ x: 4 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-primary/20 transition-all group"
    >
      <div className="shrink-0 p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
        <Lightbulb className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{rec.name}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
          <span>{rec.calories.toFixed(0)} kcal</span>
          <span>•</span>
          <span className="truncate">{rec.reason.slice(0, 30)}...</span>
        </p>
      </div>
      <ArrowRight className="shrink-0 h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
    </motion.div>
  </Link>
);

const MicroStat: FC<{label:string, value:number, unit:string, icon: React.ReactNode}> = ({ label, value, unit, icon }) => (
    <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-3">
        <div className="p-2 rounded-full bg-background">
            {icon}
        </div>
        <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-base font-bold">
                {Math.round(value)}
                <span className="text-xs font-normal text-muted-foreground ml-0.5">{unit}</span>
            </p>
        </div>
    </div>
);

const MicroNutrientGrid: FC<{ totals: DailyLog }> = ({ totals }) => (
  <Card className="border-2 shadow-xl overflow-hidden">
    <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b pb-3">
      <CardTitle className="flex items-center gap-2 text-lg">
        <Salad className="h-4 w-4 text-primary" />
        Micronutrient Overview
      </CardTitle>
    </CardHeader>
    <CardContent className="p-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2">
      <MicroStat label="Fiber" value={totals.totalFiber} unit="g" icon={<Leaf className="h-4 w-4 text-green-600"/>} />
      <MicroStat label="Sugar" value={totals.totalSugar} unit="g" icon={<Cookie className="h-4 w-4 text-orange-400"/>} />
      <MicroStat label="Sodium" value={totals.totalSodium} unit="mg" icon={<Sparkles className="h-4 w-4 text-gray-500" />} />
      <MicroStat label="Calcium" value={totals.totalCalcium} unit="mg" icon={<Sparkles className="h-4 w-4 text-gray-400" />} />
      <MicroStat label="Iron" value={totals.totalIron} unit="mg" icon={<Shield className="h-4 w-4 text-red-700"/>} />
      <MicroStat label="Vit. A" value={totals.totalVitaminA} unit="µg" icon={<Eye className="h-4 w-4 text-blue-500"/>} />
    </CardContent>
  </Card>
);

const RecommendationSkeleton = () => (
  <div className="space-y-3">
    {[1, 2].map((i) => (
      <div key={i} className="flex items-center gap-3 p-3">
        <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
    ))}
  </div>
);

const DashboardSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-b from-background to-secondary/5 pb-8 animate-pulse">
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8 space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-8 w-32 rounded-full" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
      
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  </div>
);

export default OverviewPage;
