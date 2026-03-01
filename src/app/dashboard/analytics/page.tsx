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
  AreaChart,
  Area,
} from 'recharts';
import {
  ArrowDown,
  ArrowUp,
  Award,
  CalendarDays,
  Flame,
  LineChart as LineChartIcon,
  Target,
  TrendingUp,
  Calendar,
  Activity,
  BarChart3,
  PieChart,
  Sparkles,
  Info,
  Loader2,
} from 'lucide-react';
import { getAnalyticsData, type AnalyticsData, type AnalyticsSummary } from '@/services/analyticsService';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUser, useFirestore } from '@/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type Timeframe = '7d' | '30d' | '90d';

interface AnalyticsState {
  data: {
    chartData: AnalyticsData[];
    summary: AnalyticsSummary;
    insights: string[];
    goals: { calories: number; protein: number; };
  } | null;
  isLoading: boolean;
  error: string | null;
}

export default function AnalyticsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [timeframe, setTimeframe] = useState<Timeframe>('30d');
  const [analytics, setAnalytics] = useState<AnalyticsState>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!user || !db) return;

    const fetchData = async () => {
      setAnalytics({ data: null, isLoading: true, error: null });
      try {
        const result = await getAnalyticsData(db, user.uid, timeframe);
        setAnalytics({ data: result, isLoading: false, error: null });
      } catch (err: any) {
        console.error(err);
        setAnalytics({ data: null, isLoading: false, error: err.message || 'Failed to load analytics.' });
      }
    };

    fetchData();
  }, [user, db, timeframe]);
  
  if (analytics.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (analytics.error) {
     return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Alert variant="destructive" className="max-w-lg">
                <AlertTitle>Error Loading Analytics</AlertTitle>
                <AlertDescription>{analytics.error}</AlertDescription>
            </Alert>
        </div>
     );
  }

  if (!analytics.data || analytics.data.chartData.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <EmptyState 
          icon={<BarChart3 className="h-16 w-16 text-muted-foreground" />}
          title="Not enough data yet" 
          description="Start tracking your meals for at least a day to see your analytics."
          className="border-2 border-dashed rounded-2xl py-16"
        >
          <Button asChild size="lg" className="mt-4">
            <Link href="/dashboard/tracker">
              <Activity className="mr-2 h-4 w-4" /> Start Tracking
            </Link>
          </Button>
        </EmptyState>
      </div>
    );
  }

  const { chartData, summary, insights, goals } = analytics.data;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Nutrition Analytics</h1>
              <p className="text-muted-foreground">
                Track your progress and discover insights about your eating habits.
              </p>
            </div>
          </div>
        </div>
        
        {/* Timeframe Selector */}
        <div className="flex items-center gap-2">
          <Select value={timeframe} onValueChange={(v: Timeframe) => setTimeframe(v)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="px-3 py-1.5">
            <CalendarDays className="h-4 w-4 mr-1.5" />
            {chartData.length} days
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard 
          icon={<Flame className="h-5 w-5 text-orange-500" />}
          title="Avg. Daily Calories" 
          value={summary.averageCalories.toFixed(0)} 
          unit="kcal" 
          trend={((summary.averageCalories - goals.calories) / goals.calories) * 100}
          trendLabel="vs goal"
          bgColor="bg-orange-50 dark:bg-orange-950/20"
        />
        <StatCard 
          icon={<Target className="h-5 w-5 text-green-500" />}
          title="Goal Achievement" 
          value={summary.goalAchievementRate.toFixed(0)} 
          unit="%" 
          bgColor="bg-green-50 dark:bg-green-950/20"
        />
        <StatCard 
          icon={<Activity className="h-5 w-5 text-blue-500" />}
          title="Consistency Score" 
          value={summary.consistencyScore.toFixed(0)} 
          unit="%" 
          bgColor="bg-blue-50 dark:bg-blue-950/20"
        />
        <StatCard 
          icon={<Award className="h-5 w-5 text-purple-500" />}
          title="Avg. Protein" 
          value={summary.averageProtein.toFixed(1)} 
          unit="g" 
          trend={((summary.averageProtein - goals.protein) / goals.protein) * 100}
          trendLabel="vs goal"
          bgColor="bg-purple-50 dark:bg-purple-950/20"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Calorie Trend Chart */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Calorie Trend
                  </CardTitle>
                  <CardDescription>
                    Daily intake vs. goal of {goals.calories} kcal
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="calorieGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
                    tickMargin={10}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tickMargin={10}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="calories" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fill="url(#calorieGradient)"
                    name="Calories"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="goal" 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    name="Goal"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Macronutrient Breakdown */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/5">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  Macronutrient Trends
                </CardTitle>
                <CardDescription>
                  Daily breakdown of protein, carbs, and fat
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
                    tickMargin={10}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tickMargin={10} 
                    unit="g"
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    height={36}
                    iconType="circle"
                    formatter={(value) => <span className="text-sm">{value}</span>}
                  />
                  <Bar dataKey="protein" stackId="a" fill="hsl(var(--chart-2))" name="Protein" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="carbs" stackId="a" fill="hsl(var(--chart-3))" name="Carbs" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="fat" stackId="a" fill="hsl(var(--chart-4))" name="Fat" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-8">
          {/* Performance Insights */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/5">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Performance Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              {insights.map((insight, index) => (
                 <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-primary/5">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Info className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-xs text-muted-foreground">{insight}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Best & Worst Days */}
          <div className="space-y-4">
            {summary.bestDay && (
              <Card className="overflow-hidden border-green-500/20 bg-gradient-to-br from-green-50/50 to-background dark:from-green-950/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-500/10">
                      <Star className="h-5 w-5 text-green-500 fill-green-500" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Best Day</CardTitle>
                      <CardDescription>
                        {new Date(summary.bestDay.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Calories</span>
                    <span className="text-lg font-bold">{summary.bestDay.calories} kcal</span>
                  </div>
                  <Progress value={(summary.bestDay.calories / goals.calories) * 100} className="h-2 [&>div]:bg-green-500" />
                </CardContent>
              </Card>
            )}

            {summary.highestCalorieDay && (
              <Card className="overflow-hidden border-orange-500/20 bg-gradient-to-br from-orange-50/50 to-background dark:from-orange-950/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-orange-500/10">
                      <Flame className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Highest Intake</CardTitle>
                      <CardDescription>
                        {new Date(summary.highestCalorieDay.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Calories</span>
                    <span className="text-lg font-bold">{summary.highestCalorieDay.calories} kcal</span>
                  </div>
                  <Progress 
                    value={(summary.highestCalorieDay.calories / goals.calories) * 100} 
                    className="h-2 [&>div]:bg-orange-500" 
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const StatCard: FC<{
  icon: React.ReactNode, 
  title: string, 
  value: string, 
  unit?: string, 
  trend?: number,
  trendLabel?: string,
  bgColor?: string
}> = ({ icon, title, value, unit, trend, trendLabel, bgColor }) => {
    return (
        <Card className="overflow-hidden border-0 shadow-sm">
          <div className={cn("h-1.5 w-full", bgColor?.replace('bg-', 'bg-') || 'bg-primary/20')} />
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={cn("p-2 rounded-lg", bgColor)}>
                {icon}
              </div>
              {trend !== undefined && (
                <Badge variant="outline" className={cn(
                  "text-xs",
                  trend > 0 ? "border-green-500 text-green-500" : "border-red-500 text-red-500"
                )}>
                  {trend > 0 ? <ArrowUp className="h-3 w-3 mr-0.5" /> : <ArrowDown className="h-3 w-3 mr-0.5" />}
                  {Math.abs(trend).toFixed(0)}%
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{value}</span>
              {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
            </div>
            {trendLabel && (
              <p className="text-xs text-muted-foreground mt-1">{trendLabel}</p>
            )}
          </CardContent>
        </Card>
    );
};

const CustomTooltip: FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const date = new Date(label).toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
    
    return (
      <div className="rounded-xl border bg-background/95 backdrop-blur-sm p-3 shadow-xl">
        <p className="text-xs font-medium text-muted-foreground mb-2">{date}</p>
        <div className="space-y-1.5">
          {payload.map((p: any) => (
            <div key={p.dataKey} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: p.color || p.fill }}
                />
                <span className="text-sm text-muted-foreground">{p.name || p.dataKey}</span>
              </div>
              <span className="text-sm font-medium tabular-nums">
                {p.value.toFixed(0)}{p.dataKey === 'calories' ? ' kcal' : 'g'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};
