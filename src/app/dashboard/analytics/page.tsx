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
    goals: { calories: number; protein: number; carbs: number; fat: number };
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
          title="Avg. Daily Protein"
          value={summary.averageProtein.toFixed(0)}
          unit="g"
          icon={<Beef />}
          change={((summary.averageProtein - goals.protein) / goals.protein) * 100}
        />
        <StatCard
          title="Avg. Daily Carbs"
          value={summary.averageCarbs.toFixed(0)}
          unit="g"
          icon={<Wheat />}
          change={((summary.averageCarbs - goals.carbs) / goals.carbs) * 100}
        />
        <StatCard
          title="Avg. Daily Fat"
          value={summary.averageFat.toFixed(0)}
          unit="g"
          icon={<Droplets />}
          change={((summary.averageFat - goals.fat) / goals.fat) * 100}
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
      
      <Card>
        <CardHeader>
            <CardTitle>Macronutrient Trends</CardTitle>
            <CardDescription>Your daily protein, carb, and fat intake over the selected period.</CardDescription>
        </CardHeader>
        <CardContent>
             <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                        dataKey="date"
                        tickFormatter={(str) => format(new Date(str), 'MMM d')}
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis unit="g" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                        }}
                        labelFormatter={(label) => format(new Date(label), 'EEEE, MMM d')}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="protein" name="Protein" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="carbs" name="Carbs" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="fat" name="Fat" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Average Macro Distribution</CardTitle>
                 <CardDescription>The average percentage split of your macronutrients.</CardDescription>
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

const StatCard = ({ title, value, unit, icon, change }: { title: string; value: string; unit?: string; icon: React.ReactNode; change: number; }) => {
  const isPositive = change >= 0;
  const isNeutral = Math.abs(change) < 5;
  
  let changeText: string;
  if(isNeutral) {
    changeText = 'on target'
  } else {
    changeText = `${Math.abs(change).toFixed(0)}% ${isPositive ? 'above' : 'below'} target`
  }

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
        <p className={cn("text-xs", isNeutral ? 'text-muted-foreground' : isPositive ? 'text-orange-600' : 'text-green-600')}>
            {changeText}
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
    <Skeleton className="h-[420px]" />
     <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
     </div>
  </div>
);

export default AnalyticsPage;
