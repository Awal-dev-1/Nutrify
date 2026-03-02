
'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, orderBy, limit } from 'firebase/firestore';
import { format } from 'date-fns';
import { getAnalyticsData } from '@/services/analyticsService';
import type { DailyLog, AnalyticsData } from '@/types/analytics';
import type { GeneratedRecommendations, RecommendationItem } from '@/types/recommendations';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Flame, Beef, Wheat, Droplets, PlusCircle, Search, Target, Lightbulb, ArrowRight, BrainCircuit, Loader2, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { generateDailyRecommendations, type GenerateDailyRecommendationsOutput } from '@/ai/flows/generate-daily-recommendations';
import { AiCoachCard } from '@/components/overview/ai-coach-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const OverviewPage = () => {
  const { user, userProfile, isProfileLoading } = useUser();
  const db = useFirestore();

  const [weeklyData, setWeeklyData] = useState<AnalyticsData[] | null>(null);
  const [isWeeklyLoading, setIsWeeklyLoading] = useState(true);
  const [coachData, setCoachData] = useState<GenerateDailyRecommendationsOutput | null>(null);
  const [isCoachLoading, setIsCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);

  // Fetch today's log
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const dailyLogRef = useMemoFirebase(
    () => (user ? doc(db, 'users', user.uid, 'dailyLogs', todayKey) : null),
    [user, db, todayKey]
  );
  const { data: dailyLog, isLoading: isLogLoading } = useDoc<DailyLog>(dailyLogRef);

  // Fetch last 7 days of analytics
  useEffect(() => {
    if (user && db) {
      setIsWeeklyLoading(true);
      getAnalyticsData(db, user.uid, '7d')
        .then(data => {
          setWeeklyData(data.chartData);
        })
        .catch(console.error)
        .finally(() => setIsWeeklyLoading(false));
    }
  }, [user, db]);

  // Fetch latest recommendations
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

  const todayTotals = dailyLog || { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 };
  
  const calorieProgress = (todayTotals.totalCalories / (derivedGoals.calories || 1)) * 100;
  const calorieRemaining = derivedGoals.calories - todayTotals.totalCalories;

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
            primaryGoal: userProfile.health.primaryGoal,
            dietaryPreferences: userProfile.health.dietaryPreferences || [],
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
    <div className="space-y-8">
      {/* Header */}
      <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Summary</CardTitle>
              <CardDescription>Your real-time progress towards today's goals.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                     <div>
                        <div className="flex justify-between items-baseline mb-2">
                            <span className="font-medium flex items-center gap-2"><Flame className="text-orange-500"/> Calories</span>
                            <span className="text-muted-foreground text-sm">{todayTotals.totalCalories.toFixed(0)} / {derivedGoals.calories.toFixed(0)} kcal</span>
                        </div>
                        <Progress value={calorieProgress} />
                    </div>
                    <div className="text-center md:border-l md:pl-6">
                        <p className="text-sm text-muted-foreground">Calories Remaining</p>
                        <p className="text-4xl font-bold text-primary">{Math.round(calorieRemaining)}</p>
                    </div>
                </div>

              <div className="grid grid-cols-3 gap-4 text-center pt-6 border-t">
                 <MacroStat icon={<Beef className="text-red-500"/>} label="Protein" value={todayTotals.totalProtein} goal={derivedGoals.protein} />
                 <MacroStat icon={<Wheat className="text-yellow-600"/>} label="Carbs" value={todayTotals.totalCarbs} goal={derivedGoals.carbs} />
                 <MacroStat icon={<Droplets className="text-blue-500"/>} label="Fat" value={todayTotals.totalFat} goal={derivedGoals.fat} />
              </div>
            </CardContent>
          </Card>
          
          {/* Weekly Trend */}
          <Card>
            <CardHeader>
                <CardTitle>Weekly Calorie Trend</CardTitle>
                <CardDescription>Your calorie intake over the last 7 days.</CardDescription>
            </CardHeader>
            <CardContent>
                 <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tickFormatter={(val) => format(new Date(val), 'EEE')} fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--background))',
                                border: '1px solid hsl(var(--border))',
                            }}
                            labelFormatter={(label) => format(new Date(label), 'MMM d')}
                        />
                        <Bar dataKey="calories" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column */}
        <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                    <Button asChild className="h-12"><Link href="/dashboard/tracker"><PlusCircle className="mr-2 h-4 w-4" /> Add Meal</Link></Button>
                    <Button asChild variant="outline" className="h-12"><Link href="/dashboard/search"><Search className="mr-2 h-4 w-4" /> Search</Link></Button>
                    <Button asChild variant="secondary" className="col-span-2 h-12"><Link href="/dashboard/goals"><Target className="mr-2 h-4 w-4" /> Update Goals</Link></Button>
                </CardContent>
            </Card>

            {/* Smart Recommendations */}
            <Card>
                <CardHeader>
                     <CardTitle className="text-lg">Smart Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                  {isRecsLoading ? <RecommendationSkeleton/> : 
                    latestRecs.length > 0 ? (
                        <div className="space-y-3">
                            {latestRecs.slice(0, 2).map((rec, i) => <RecommendationItemPreview key={i} rec={rec} />)}
                            <Button asChild variant="secondary" className="w-full mt-2">
                                <Link href="/dashboard/recommendations">View All Recommendations</Link>
                            </Button>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No recommendations yet. Generate them on the Recommendations page!</p>
                    )
                  }
                </CardContent>
            </Card>

            {/* Hydration Tip */}
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-blue-600 dark:text-blue-300"><Droplets /> Hydration Tip</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                        Drinking water before a meal can help with digestion and make you feel fuller, preventing overeating.
                    </p>
                </CardContent>
            </Card>
        </div>
      </div>

        {/* AI Daily Coach Section */}
        <div className="mt-6">
            {isCoachLoading ? (
                <Card>
                    <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-2">
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        <p className="text-sm font-semibold">Your coach is thinking...</p>
                        <p className="text-xs text-muted-foreground">This may take a moment.</p>
                    </CardContent>
                </Card>
            ) : coachError ? (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>AI Coach Error</AlertTitle>
                    <AlertDescription>{coachError}</AlertDescription>
                </Alert>
            ) : coachData ? (
                <AiCoachCard data={coachData} />
            ) : (
                <Card className="border-2 border-dashed">
                    <CardContent className="p-6 text-center">
                        <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary/10 mb-4">
                            <BrainCircuit className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold">Need some guidance?</h3>
                        <p className="text-muted-foreground text-sm mt-1 mb-4">Get personalized tips, meal ideas, and recipes for the rest of your day.</p>
                        <Button onClick={handleGetCoachPlan}>Ask AI Coach</Button>
                    </CardContent>
                </Card>
            )}
        </div>
    </div>
  );
};

const MacroStat = ({ icon, label, value, goal }: { icon: React.ReactNode, label: string, value: number, goal: number }) => (
    <div>
        <div className="flex items-center justify-center gap-1.5 mb-1">{icon} <span className="font-medium">{label}</span></div>
        <p className="text-lg font-bold">{value.toFixed(0)}g</p>
        <p className="text-xs text-muted-foreground">Goal: {goal.toFixed(0)}g</p>
    </div>
);

const RecommendationItemPreview = ({ rec }: { rec: RecommendationItem }) => (
    <Link href={`/dashboard/food/${rec.foodId}`} className="block">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors group">
            <div className="p-2 bg-background rounded-md">
                <Lightbulb className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
                <p className="font-medium text-sm truncate">{rec.name}</p>
                <p className="text-xs text-muted-foreground">{rec.calories.toFixed(0)} kcal &bull; {rec.reason.slice(0, 30)}...</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
        </div>
    </Link>
);


const RecommendationSkeleton = () => (
    <div className="space-y-3">
        <div className="flex items-center gap-3 p-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
            </div>
        </div>
         <div className="flex items-center gap-3 p-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
            </div>
        </div>
    </div>
);


const DashboardSkeleton = () => (
  <div className="space-y-8">
    <Skeleton className="h-9 w-80" />
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-64 mt-2" /></CardHeader>
          <CardContent className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div><div className="grid grid-cols-3 gap-4 pt-6 border-t"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div></CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-64 mt-2" /></CardHeader>
          <CardContent><Skeleton className="h-[250px] w-full" /></CardContent>
        </Card>
      </div>
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full col-span-2" /></CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
          <CardContent><RecommendationSkeleton /></CardContent>
        </Card>
         <Card>
          <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
          <CardContent><Skeleton className="h-10 w-full" /></CardContent>
        </Card>
      </div>
    </div>
  </div>
);

export default OverviewPage;
