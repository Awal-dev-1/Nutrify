'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { getAnalyticsData } from '@/services/analyticsService';
import type { DailyLog, AnalyticsData, LoggedFoodItem } from '@/types/analytics';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Flame, Beef, Wheat, Droplets, PlusCircle, ScanLine, Utensils } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import Image from 'next/image';

const OverviewPage = () => {
  const { user, userProfile, isProfileLoading } = useUser();
  const db = useFirestore();

  const [weeklyData, setWeeklyData] = useState<AnalyticsData[] | null>(null);
  const [isWeeklyLoading, setIsWeeklyLoading] = useState(true);

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

  const isLoading = isProfileLoading || isLogLoading || isWeeklyLoading;
  
  const userGoals = userProfile?.goals || { dailyCalorieGoal: 2000, proteinPercentageGoal: 30, carbsPercentageGoal: 40, fatPercentageGoal: 30 };
  const derivedGoals = {
    calories: userGoals.dailyCalorieGoal,
    protein: (userGoals.dailyCalorieGoal * (userGoals.proteinPercentageGoal / 100)) / 4,
    carbs: (userGoals.dailyCalorieGoal * (userGoals.carbsPercentageGoal / 100)) / 4,
    fat: (userGoals.dailyCalorieGoal * (userGoals.fatPercentageGoal / 100)) / 9,
  };

  const todayTotals = dailyLog || { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 };
  const recentItems = useMemo(() => {
    if (!dailyLog?.meals) return [];
    return Object.values(dailyLog.meals).flat().slice(-3).reverse();
  }, [dailyLog]);
  
  const calorieProgress = (todayTotals.totalCalories / (derivedGoals.calories || 1)) * 100;

  if (isLoading) {
    return <DashboardSkeleton />;
  }
  
  const hasLoggedAnythingToday = dailyLog && dailyLog.totalCalories > 0;
  const hasLoggedAnythingEver = weeklyData && weeklyData.some(d => d.calories > 0);


  if (!hasLoggedAnythingToday && !hasLoggedAnythingEver) {
     return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Welcome, {userProfile?.name || 'User'}!</h1>
            <EmptyState
              icon={<Utensils className="h-16 w-16 text-muted-foreground" />}
              title="Ready to start your day?"
              description="Log your first meal to see your personalized dashboard come to life."
            >
              <div className="flex gap-4 mt-6">
                <Button size="lg" asChild>
                    <Link href="/dashboard/tracker"><PlusCircle className="mr-2 h-4 w-4" /> Log a Meal</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                    <Link href="/dashboard/recognize"><ScanLine className="mr-2 h-4 w-4" /> Scan a Meal</Link>
                </Button>
              </div>
            </EmptyState>
        </div>
     );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <h1 className="text-3xl font-bold tracking-tight">Today's Overview</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Summary</CardTitle>
              <CardDescription>Your progress towards today's goals.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between items-baseline mb-2">
                    <span className="font-medium flex items-center gap-2"><Flame className="text-orange-500"/> Calories</span>
                    <span className="text-muted-foreground text-sm">{todayTotals.totalCalories.toFixed(0)} / {derivedGoals.calories.toFixed(0)} kcal</span>
                </div>
                <Progress value={calorieProgress} />
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
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
                <CardContent className="flex flex-col gap-3">
                    <Button size="lg" asChild>
                        <Link href="/dashboard/tracker"><PlusCircle className="mr-2 h-4 w-4" /> Log a Meal</Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                        <Link href="/dashboard/recognize"><ScanLine className="mr-2 h-4 w-4" /> Scan a Meal</Link>
                    </Button>
                </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    {recentItems.length > 0 ? (
                        <div className="space-y-3">
                            {recentItems.map(item => (
                                <RecentItem key={item.logId} item={item} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No meals logged today.</p>
                    )}
                </CardContent>
            </Card>
        </div>
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

const RecentItem = ({ item }: { item: LoggedFoodItem }) => (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
        <Image src={item.imageUrl} alt={item.name} width={40} height={40} className="rounded-md object-cover h-10 w-10" />
        <div className="flex-1">
            <p className="font-medium text-sm truncate">{item.name}</p>
            <p className="text-xs text-muted-foreground">{item.calories.toFixed(0)} kcal &bull; {item.quantity}g</p>
        </div>
    </div>
);

const DashboardSkeleton = () => (
  <div className="space-y-8">
    <Skeleton className="h-9 w-64" />
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-64 mt-2" /></CardHeader>
          <CardContent className="space-y-6"><Skeleton className="h-8 w-full" /><div className="grid grid-cols-3 gap-4"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div></CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-64 mt-2" /></CardHeader>
          <CardContent><Skeleton className="h-[250px] w-full" /></CardContent>
        </Card>
      </div>
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
          <CardContent className="flex flex-col gap-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
          <CardContent className="space-y-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></CardContent>
        </Card>
      </div>
    </div>
  </div>
);

export default OverviewPage;
