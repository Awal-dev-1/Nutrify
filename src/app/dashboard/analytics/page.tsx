'use client';

import { useState, useMemo, FC, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  ArrowDown,
  ArrowUp,
  Award,
  CalendarDays,
  Flame,
  Frown,
  LineChart as LineChartIcon,
  Star,
  Target,
} from 'lucide-react';
import {
  generateMockAnalyticsData,
  userAnalyticsGoals,
  type DailyRecord,
} from '@/lib/analytics-data';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/shared/empty-state';
import Link from 'next/link';

type Timeframe = '7d' | '30d';

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState<Timeframe>('7d');
  const [mockAnalyticsData, setMockAnalyticsData] = useState<DailyRecord[]>([]);

  useEffect(() => {
    setMockAnalyticsData(generateMockAnalyticsData());
  }, []);

  const data = useMemo(() => {
    const days = timeframe === '7d' ? 7 : 30;
    return mockAnalyticsData.slice(-days);
  }, [timeframe, mockAnalyticsData]);

  const summaryStats = useMemo(() => {
    if (data.length === 0)
      return {
        avgCalories: 0,
        avgProtein: 0,
        goalAchievement: 0,
        highestCalorieDay: null,
        bestDay: null,
      };

    const total = data.reduce(
      (acc, day) => {
        acc.calories += day.calories;
        acc.protein += day.protein;
        acc.carbs += day.carbs;
        acc.fat += day.fat;
        if (day.calories <= userAnalyticsGoals.calories) {
          acc.daysGoalMet++;
        }
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, daysGoalMet: 0 }
    );

    const highestCalorieDay = [...data].sort((a, b) => b.calories - a.calories)[0];
    const bestDay = [...data]
      .filter((d) => d.calories <= userAnalyticsGoals.calories)
      .sort((a, b) => b.calories - a.calories)[0];

    return {
      avgCalories: total.calories / data.length,
      avgProtein: total.protein / data.length,
      goalAchievement: (total.daysGoalMet / data.length) * 100,
      highestCalorieDay,
      bestDay: bestDay || null,
    };
  }, [data]);
  
  if (data.length === 0) {
    return (
        <EmptyState title="Not enough data" description="Start tracking your meals for at least a day to see your analytics.">
            <Button asChild className="mt-4"><Link href="/dashboard/tracker">Start Tracking</Link></Button>
        </EmptyState>
    )
  }

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Track your nutrition progress over time.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-muted p-1 rounded-md">
          <Button
            variant={timeframe === '7d' ? 'secondary' : 'ghost'}
            onClick={() => setTimeframe('7d')}
            className="w-full sm:w-auto"
          >
            7 Days
          </Button>
          <Button
            variant={timeframe === '30d' ? 'secondary' : 'ghost'}
            onClick={() => setTimeframe('30d')}
             className="w-full sm:w-auto"
          >
            30 Days
          </Button>
        </div>
      </div>

      {/* 4. Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
         <StatCard icon={<Flame />} title="Avg. Daily Calories" value={summaryStats.avgCalories.toFixed(0)} unit="kcal" trend={5} />
         <StatCard icon={<Target />} title="Goal Achievement" value={summaryStats.goalAchievement.toFixed(0)} unit="%" trend={-2} />
         <StatCard icon={<LineChartIcon />} title="Avg. Daily Protein" value={summaryStats.avgProtein.toFixed(1)} unit="g" trend={8} />
         <StatCard icon={<Award />} title="Highest Calorie Day" value={summaryStats.highestCalorieDay?.calories.toFixed(0) || "N/A"} unit="kcal" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* 2. Calorie Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Calorie Trend</CardTitle>
              <CardDescription>
                Your daily calorie intake vs. your goal of {userAnalyticsGoals.calories} kcal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.map(d => ({ ...d, goal: userAnalyticsGoals.calories }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})} tickMargin={10} />
                  <YAxis tickMargin={10}/>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="calories" stroke="hsl(var(--primary))" strokeWidth={2} name="Consumed" dot={false} />
                  <Line type="monotone" dataKey="goal" stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="5 5" name="Goal" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1 space-y-6">
             {/* 5. Performance Insights */}
            <Card>
                <CardHeader>
                    <CardTitle>Performance Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <p>You met your calorie goal on {summaryStats.goalAchievement.toFixed(0)}% of the days.</p>
                    <p>Your average protein intake was strong at {summaryStats.avgProtein.toFixed(1)}g.</p>
                    <p>Weekends seem to be higher in calories. Awareness is the first step!</p>
                </CardContent>
            </Card>
            {/* 7. Best & Worst Day */}
            <div className="space-y-6">
                {summaryStats.bestDay && (
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="flex-row items-center gap-4 space-y-0">
                        <Star className="w-8 h-8 text-yellow-500" />
                        <div>
                            <CardTitle>Best Day</CardTitle>
                            <CardDescription>{new Date(summaryStats.bestDay.date).toLocaleDateString()}</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p>{summaryStats.bestDay.calories} kcal - You met all your goals this day. Great job!</p>
                    </CardContent>
                </Card>
                )}
                 {summaryStats.highestCalorieDay && (
                <Card className="bg-destructive/5 border-destructive/20">
                    <CardHeader className="flex-row items-center gap-4 space-y-0">
                        <Frown className="w-8 h-8 text-destructive" />
                         <div>
                            <CardTitle>Highest Intake Day</CardTitle>
                            <CardDescription>{new Date(summaryStats.highestCalorieDay.date).toLocaleDateString()}</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p>{summaryStats.highestCalorieDay.calories} kcal - {Math.round(summaryStats.highestCalorieDay.calories - userAnalyticsGoals.calories)} kcal over goal.</p>
                    </CardContent>
                </Card>
                )}
            </div>
        </div>
      </div>
      
       {/* 3. Macronutrient Breakdown */}
      <Card>
          <CardHeader>
            <CardTitle>Macronutrient Trends</CardTitle>
            <CardDescription>Your daily macro intake over the last {timeframe === '7d' ? 7 : 30} days.</CardDescription>
          </CardHeader>
          <CardContent>
             <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})} tickMargin={10} />
                    <YAxis tickMargin={10} unit="g" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="protein" stackId="a" fill="hsl(var(--chart-2))" name="Protein (g)" />
                    <Bar dataKey="carbs" stackId="a" fill="hsl(var(--chart-3))" name="Carbs (g)" />
                    <Bar dataKey="fat" stackId="a" fill="hsl(var(--chart-4))" name="Fat (g)" />
                </BarChart>
             </ResponsiveContainer>
          </CardContent>
      </Card>

    </div>
  );
}

const StatCard: FC<{icon: React.ReactNode, title: string, value: string, unit?: string, trend?: number}> = ({ icon, title, value, unit, trend }) => {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <span className="text-muted-foreground">{icon}</span>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value} <span className="text-base text-muted-foreground">{unit}</span></div>
                {trend !== undefined && (
                    <p className={cn("text-xs text-muted-foreground flex items-center", trend > 0 ? "text-green-600" : "text-red-600")}>
                        {trend > 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                        {Math.abs(trend)}% from last period
                    </p>
                )}
            </CardContent>
        </Card>
    );
};


const CustomTooltip: FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const date = new Date(label).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric'});
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              Date
            </span>
            <span className="font-bold text-muted-foreground">
              {date}
            </span>
          </div>
        </div>
        <div className="mt-2 space-y-1">
             {payload.map((p: any) => (
                <div key={p.dataKey} className="flex items-center justify-between">
                    <div className="flex items-center">
                        <span className="w-2.5 h-2.5 rounded-full mr-2" style={{backgroundColor: p.color || p.fill}}></span>
                        <p className="text-sm text-muted-foreground">{p.name || p.dataKey}</p>
                    </div>
                    <p className="text-sm font-medium">{p.value.toFixed(0)}</p>
                </div>
            ))}
        </div>
      </div>
    );
  }

  return null;
};
