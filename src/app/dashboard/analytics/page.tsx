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
  Target,
  TrendingUp,
  Beef,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type Timeframe = '7d' | '30d' | '90d';

const AnalyticsPage = () => {
  const { user } = useUser();
  const db = useFirestore();
  const [timeframe, setTimeframe] = useState<Timeframe>('7d');
  const [data, setData] = useState<{
    chartData: AnalyticsData[];
    summary: AnalyticsSummary;
    insights: string[];
    goals: { calories: number; protein: number };
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
  
  const macroDistribution = useMemo(() => {
    if (!data?.chartData) return [];
    const totals = data.chartData.reduce(
        (acc, day) => {
            acc.protein += day.protein;
            acc.carbs += day.carbs;
            acc.fat += day.fat;
            return acc;
        }, { protein: 0, carbs: 0, fat: 0 }
    );
    const totalMacros = totals.protein + totals.carbs + totals.fat;
    if (totalMacros === 0) return [];
    return [
      { name: 'Protein', value: totals.protein, color: 'hsl(var(--chart-2))' },
      { name: 'Carbs', value: totals.carbs, color: 'hsl(var(--chart-3))' },
      { name: 'Fat', value: totals.fat, color: 'hsl(var(--chart-4))' },
    ];
  }, [data]);


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
        <StatCard
          title="Avg. Daily Calories"
          value={summary.averageCalories.toFixed(0)}
          unit="kcal"
          icon={<Activity />}
          change={((summary.averageCalories - goals.calories) / goals.calories) * 100}
        />
        <StatCard
          title="Goal Achievement"
          value={summary.goalAchievementRate.toFixed(0)}
          unit="%"
          icon={<Target />}
          change={summary.goalAchievementRate - 80}
        />
        <StatCard
          title="Consistency Score"
          value={summary.consistencyScore.toFixed(0)}
          unit="/ 100"
          icon={<TrendingUp />}
          change={summary.consistencyScore - 80}
        />
        <StatCard
          title="Avg. Daily Protein"
          value={summary.averageProtein.toFixed(0)}
          unit="grams"
          icon={<Beef />}
          change={((summary.averageProtein - goals.protein) / goals.protein) * 100}
        />
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
      
      <div className="grid gap-4 md:grid-cols-5">
        {/* Insights & Macro Chart */}
        <div className="md:col-span-3 grid gap-4">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lightbulb /> AI-Generated Insights
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3 list-disc list-inside text-sm">
                        {insights.map((insight, i) => <li key={i}>{insight}</li>)}
                    </ul>
                </CardContent>
            </Card>
        </div>
        <div className="md:col-span-2">
             <Card>
                <CardHeader>
                    <CardTitle>Average Macro Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                     <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={macroDistribution}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                            {macroDistribution.map((entry) => (
                                <Cell key={entry.name} fill={entry.color} />
                            ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))',
                                }}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
             </Card>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, unit, icon, change }: { title: string; value: string; unit?: string; icon: React.ReactNode; change: number; }) => {
  const isPositive = change >= 0;
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
        <p className="text-xs text-muted-foreground">
          {change.toFixed(1)}% {isPositive ? 'above' : 'below'} target
        </p>
      </CardContent>
    </Card>
  );
};

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
     <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
     </div>
  </div>
);

export default AnalyticsPage;
