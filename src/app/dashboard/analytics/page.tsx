'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  LineChart,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { useUser, useFirestore } from '@/firebase';
import { getAnalyticsData } from '@/services/analyticsService';
import type {
  AnalyticsData,
  AnalyticsSummary,
} from '@/types/analytics';
import {
  Activity,
  Lightbulb,
  Beef,
  AlertCircle,
  Wheat,
  Droplets,
  Shield,
  Eye,
  Wind,
  Target,
  TrendingUp,
  Award,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

type Timeframe = '7d' | '30d' | '90d';

const AnalyticsPage = () => {
  const { user } = useUser();
  const db = useFirestore();
  const [timeframe, setTimeframe] = useState<Timeframe>('30d');
  const [data, setData] = useState<{
    chartData: AnalyticsData[];
    summary: AnalyticsSummary;
    insights: string[];
    goals: { calories: number; protein: number; carbs: number; fat: number; iron: number; vitaminA: number; sodium: number; };
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && db) {
      setIsLoading(true);
      setError(null);
      getAnalyticsData(db, user.uid, timeframe)
        .then((result) => {
          setData(result);
        })
        .catch((err) => {
          console.error('Failed to get analytics data:', err);
          setError(err.message || 'Could not load analytics data.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [user, db, timeframe]);
  
  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (error) {
    return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load Analytics</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
    );
  }

  if (!data || data.chartData.length === 0 || data.summary.averageCalories === 0) {
    return (
        <div className="space-y-6">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Analytics & Insights
                </h1>
                <p className="text-muted-foreground">
                    Your nutritional journey over the last {timeframe === '7d' ? '7' : timeframe === '30d' ? '30' : '90'} days.
                </p>
                </div>
                <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
                {(['7d', '30d', '90d'] as Timeframe[]).map((t) => (
                    <Button
                    key={t}
                    variant={timeframe === t ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setTimeframe(t)}
                    className="capitalize"
                    >
                    {t}
                    </Button>
                ))}
                </div>
            </div>
            <EmptyState
                title="Not enough data"
                description="Log your meals for a few days to unlock powerful analytics and insights."
            />
      </div>
    );
  }

  const { chartData, summary, insights, goals } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Analytics & Insights
          </h1>
          <p className="text-muted-foreground">
            Your nutritional journey over the last {timeframe === '7d' ? '7' : timeframe === '30d' ? '30' : '90'} days.
          </p>
        </div>
        <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
          {(['7d', '30d', '90d'] as Timeframe[]).map((t) => (
            <Button
              key={t}
              variant={timeframe === t ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeframe(t)}
              className="capitalize"
            >
              {t}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Avg. Daily Calories" value={summary.averageCalories.toFixed(0)} unit="kcal" icon={<Activity />} />
        <StatCard title="Goal Achievement" value={`${summary.goalAchievementRate.toFixed(0)}%`} unit="of days" icon={<Target />} />
        <StatCard title="Consistency Score" value={`${summary.consistencyScore.toFixed(0)}%`} unit="stability" icon={<TrendingUp />} />
        <StatCard title="Avg. Daily Protein" value={summary.averageProtein.toFixed(0)} unit="g" icon={<Beef />} />
      </div>

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Calorie Intake vs. Goal</CardTitle>
          <CardDescription>
            Your daily calorie consumption compared to your goal of {goals.calories} kcal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(str) => format(new Date(str), 'MMM d')}
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                }}
                labelFormatter={(label) => format(new Date(label), 'EEEE, MMM d')}
              />
              <Legend />
              <Bar dataKey="calories" name="Calories" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Line
                type="monotone"
                dataKey="goal"
                name="Goal"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Goal Comparison Section */}
      <Card>
        <CardHeader>
          <CardTitle>Average Intake vs. Goals</CardTitle>
          <CardDescription>How your average daily intake compares to your targets.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <GoalProgressBar label="Calories" value={summary.averageCalories} goal={goals.calories} unit="kcal" />
          <GoalProgressBar label="Protein" value={summary.averageProtein} goal={goals.protein} unit="g" />
          <GoalProgressBar label="Carbs" value={summary.averageCarbs} goal={goals.carbs} unit="g" />
          <GoalProgressBar label="Fat" value={summary.averageFat} goal={goals.fat} unit="g" />
        </CardContent>
      </Card>

      {/* Trend Charts */}
       <div className="grid lg:grid-cols-2 gap-4">
         <Card>
            <CardHeader>
                <CardTitle>Macronutrient Trends</CardTitle>
                <CardDescription>Daily protein, carb, and fat intake.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tickFormatter={(str) => format(new Date(str), 'MMM d')} fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis unit="g" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} labelFormatter={(label) => format(new Date(label), 'EEEE, MMM d')} />
                        <Legend />
                        <Line type="monotone" dataKey="protein" name="Protein" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="carbs" name="Carbs" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="fat" name="Fat" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle>Micronutrient Trends</CardTitle>
                <CardDescription>Daily iron and Vitamin A intake.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tickFormatter={(str) => format(new Date(str), 'MMM d')} fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="left" unit="mg" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="right" orientation="right" unit="µg" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} labelFormatter={(label) => format(new Date(label), 'EEEE, MMM d')} />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="iron" name="Iron (mg)" stroke="hsl(var(--chart-5))" strokeWidth={2} dot={false} />
                        <Line yAxisId="right" type="monotone" dataKey="vitaminA" name="Vitamin A (µg)" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
       </div>

      {/* Insights Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {summary.lowestCalorieDay && (
            <DaySummaryCard 
                day={summary.lowestCalorieDay} 
                title="Best Calorie Day" 
                icon={<Award className="text-green-500"/>} 
            />
        )}
        {summary.highestCalorieDay && (
            <DaySummaryCard 
                day={summary.highestCalorieDay} 
                title="Highest Intake Day" 
                icon={<AlertTriangle className="text-orange-500" />}
            />
        )}
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lightbulb /> AI-Generated Insights
                </CardTitle>
                <CardDescription>Actionable advice based on your data.</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-3 list-disc list-inside text-sm">
                    {insights.map((insight, i) => <li key={i}>{insight}</li>)}
                </ul>
            </CardContent>
        </Card>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, unit, icon }: { title: string; value: string; unit?: string; icon: React.ReactNode; }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}
          {unit && <span className="text-base font-normal text-muted-foreground ml-1">{unit}</span>}
        </div>
      </CardContent>
    </Card>
  );
};

const GoalProgressBar = ({ label, value, goal, unit }: { label: string; value: number; goal: number; unit: string; }) => {
  const percentage = goal > 0 ? (value / goal) * 100 : 0;
  const isOver = percentage > 105;
  const isUnder = percentage < 95;
  
  return (
    <div>
      <div className="flex justify-between mb-1 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {value.toFixed(0)} / {goal.toFixed(0)} {unit}
        </span>
      </div>
       <Progress value={Math.min(100, percentage)} className={cn(isOver && "[&>div]:bg-destructive")} />
    </div>
  )
};

const DaySummaryCard = ({ day, title, icon }: { day: AnalyticsData, title: string, icon: React.ReactNode}) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    {icon} {title}
                </CardTitle>
                <CardDescription>{format(new Date(day.date), 'EEEE, MMM d')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Calories:</span> <span className="font-medium">{day.calories.toFixed(0)} kcal</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Protein:</span> <span className="font-medium">{day.protein.toFixed(0)}g</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Carbs:</span> <span className="font-medium">{day.carbs.toFixed(0)}g</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Fat:</span> <span className="font-medium">{day.fat.toFixed(0)}g</span></div>
            </CardContent>
        </Card>
    )
}

const AnalyticsSkeleton = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-9 w-48" />
    </div>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
    </div>
    <Skeleton className="h-[420px]" />
    <Skeleton className="h-60" />
     <div className="grid lg:grid-cols-2 gap-4">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
    </div>
     <div className="grid lg:grid-cols-3 gap-4">
        <Skeleton className="h-60" />
        <Skeleton className="h-60" />
        <Skeleton className="h-60" />
     </div>
  </div>
);

export default AnalyticsPage;
