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
  AreaChart,
  Area,
  ComposedChart,
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
  TrendingUp,
  TrendingDown,
  Calendar,
  ChevronRight,
  Activity,
  BarChart3,
  PieChart,
  Sparkles,
  Info,
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
  CardFooter,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Timeframe = '7d' | '30d' | '90d';

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState<Timeframe>('30d');
  const [mockAnalyticsData, setMockAnalyticsData] = useState<DailyRecord[]>([]);

  useEffect(() => {
    setMockAnalyticsData(generateMockAnalyticsData());
  }, []);

  const data = useMemo(() => {
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    return mockAnalyticsData.slice(-days);
  }, [timeframe, mockAnalyticsData]);

  const summaryStats = useMemo(() => {
    if (data.length === 0)
      return {
        avgCalories: 0,
        avgProtein: 0,
        avgIron: 0,
        avgVitaminA: 0,
        avgCalcium: 0,
        goalAchievement: 0,
        highestCalorieDay: null,
        lowestCalorieDay: null,
        bestDay: null,
        consistencyScore: 0,
      };

    const total = data.reduce(
      (acc, day) => {
        acc.calories += day.calories;
        acc.protein += day.protein;
        acc.carbs += day.carbs;
        acc.fat += day.fat;
        acc.iron += day.iron;
        acc.vitaminA += day.vitaminA;
        acc.calcium += day.calcium;
        if (day.calories <= userAnalyticsGoals.calories) {
          acc.daysGoalMet++;
        }
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, daysGoalMet: 0, iron: 0, vitaminA: 0, calcium: 0 }
    );

    const highestCalorieDay = [...data].sort((a, b) => b.calories - a.calories)[0];
    const lowestCalorieDay = [...data].sort((a, b) => a.calories - b.calories)[0];
    const bestDay = [...data]
      .filter((d) => d.calories <= userAnalyticsGoals.calories)
      .sort((a, b) => b.calories - a.calories)[0];

    // Calculate consistency score (lower variance = higher score)
    const calorieVariance = data.reduce((acc, day) => acc + Math.abs(day.calories - total.calories / data.length), 0) / data.length;
    const consistencyScore = Math.max(0, 100 - (calorieVariance / 50) * 100);

    return {
      avgCalories: total.calories / data.length,
      avgProtein: total.protein / data.length,
      avgIron: total.iron / data.length,
      avgVitaminA: total.vitaminA / data.length,
      avgCalcium: total.calcium / data.length,
      goalAchievement: (total.daysGoalMet / data.length) * 100,
      highestCalorieDay,
      lowestCalorieDay,
      bestDay: bestDay || null,
      consistencyScore: Math.min(100, consistencyScore),
    };
  }, [data]);
  
  if (data.length === 0) {
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
            {data.length} days
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard 
          icon={<Flame className="h-5 w-5 text-orange-500" />}
          title="Avg. Daily Calories" 
          value={summaryStats.avgCalories.toFixed(0)} 
          unit="kcal" 
          trend={summaryStats.avgCalories > userAnalyticsGoals.calories ? -5 : 3}
          trendLabel="vs target"
          bgColor="bg-orange-50 dark:bg-orange-950/20"
        />
        <StatCard 
          icon={<Target className="h-5 w-5 text-green-500" />}
          title="Goal Achievement" 
          value={summaryStats.goalAchievement.toFixed(0)} 
          unit="%" 
          trend={summaryStats.goalAchievement > 70 ? 12 : -2}
          trendLabel="vs last period"
          bgColor="bg-green-50 dark:bg-green-950/20"
        />
        <StatCard 
          icon={<Activity className="h-5 w-5 text-blue-500" />}
          title="Consistency Score" 
          value={summaryStats.consistencyScore.toFixed(0)} 
          unit="%" 
          trend={summaryStats.consistencyScore > 80 ? 5 : -3}
          trendLabel="vs last period"
          bgColor="bg-blue-50 dark:bg-blue-950/20"
        />
        <StatCard 
          icon={<Award className="h-5 w-5 text-purple-500" />}
          title="Avg. Protein" 
          value={summaryStats.avgProtein.toFixed(1)} 
          unit="g" 
          trend={8}
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
                    Daily intake vs. goal of {userAnalyticsGoals.calories} kcal
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="px-3 py-1">
                  <Calendar className="h-3 w-3 mr-1" /> Daily
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={data.map(d => ({ ...d, goal: userAnalyticsGoals.calories }))}>
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-primary" />
                    Macronutrient Trends
                  </CardTitle>
                  <CardDescription>
                    Daily breakdown of protein, carbs, and fat
                  </CardDescription>
                </div>
                <Badge variant="outline" className="px-3 py-1">
                  Stacked view
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={data}>
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
          
          {/* Micronutrient Trends */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Micronutrient Trends
                  </CardTitle>
                  <CardDescription>
                    Daily intake of key vitamins and minerals
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="px-3 py-1">
                  Daily Intake
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={data}>
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
                    yAxisId="left"
                    tickMargin={10} 
                    unit="mg"
                    domain={[0, 'dataMax + 100']}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tickMargin={10} 
                    unit="mcg"
                    domain={[0, 'dataMax + 100']}
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
                  <Line yAxisId="left" type="monotone" dataKey="iron" name="Iron (mg)" stroke="hsl(var(--chart-5))" dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="vitaminA" name="Vitamin A (mcg)" stroke="hsl(var(--chart-1))" dot={false} />
                  <Line yAxisId="left" type="monotone" dataKey="calcium" name="Calcium (mg)" stroke="hsl(var(--chart-4))" dot={false} />
                </LineChart>
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
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                <div className="p-2 rounded-full bg-green-500/10">
                  <Target className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Goal Achievement</p>
                  <p className="text-xs text-muted-foreground">
                    You met your calorie goal on {summaryStats.goalAchievement.toFixed(0)}% of days
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <div className="p-2 rounded-full bg-blue-500/10">
                  <Activity className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Protein Intake</p>
                  <p className="text-xs text-muted-foreground">
                    Average {summaryStats.avgProtein.toFixed(1)}g per day
                    {summaryStats.avgProtein > userAnalyticsGoals.protein ? ' - Exceeding goal!' : ' - Room for improvement'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                <div className="p-2 rounded-full bg-purple-500/10">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Consistency</p>
                  <p className="text-xs text-muted-foreground">
                    Your consistency score is {summaryStats.consistencyScore.toFixed(0)}%
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/5 p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Info className="h-3 w-3" />
                <span>Based on your {data.length}-day history</span>
              </div>
            </CardFooter>
          </Card>

          {/* Best & Worst Days */}
          <div className="space-y-4">
            {summaryStats.bestDay && (
              <Card className="overflow-hidden border-green-500/20 bg-gradient-to-br from-green-50/50 to-background dark:from-green-950/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-500/10">
                      <Star className="h-5 w-5 text-green-500 fill-green-500" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Best Day</CardTitle>
                      <CardDescription>
                        {new Date(summaryStats.bestDay.date).toLocaleDateString('en-US', { 
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
                    <span className="text-lg font-bold">{summaryStats.bestDay.calories} kcal</span>
                  </div>
                  <Progress value={100} className="h-2 [&>div]:bg-green-500" />
                  <p className="text-xs text-muted-foreground mt-2">
                    You met all your goals this day. Great job! ✨
                  </p>
                </CardContent>
              </Card>
            )}

            {summaryStats.highestCalorieDay && (
              <Card className="overflow-hidden border-orange-500/20 bg-gradient-to-br from-orange-50/50 to-background dark:from-orange-950/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-orange-500/10">
                      <Flame className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Highest Intake</CardTitle>
                      <CardDescription>
                        {new Date(summaryStats.highestCalorieDay.date).toLocaleDateString('en-US', { 
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
                    <span className="text-lg font-bold">{summaryStats.highestCalorieDay.calories} kcal</span>
                  </div>
                  <Progress 
                    value={(summaryStats.highestCalorieDay.calories / userAnalyticsGoals.calories) * 100} 
                    className="h-2 [&>div]:bg-orange-500" 
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {Math.round(summaryStats.highestCalorieDay.calories - userAnalyticsGoals.calories)} kcal over goal
                  </p>
                </CardContent>
              </Card>
            )}

            {summaryStats.lowestCalorieDay && (
              <Card className="overflow-hidden border-blue-500/20 bg-gradient-to-br from-blue-50/50 to-background dark:from-blue-950/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-500/10">
                      <TrendingDown className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Lowest Intake</CardTitle>
                      <CardDescription>
                        {new Date(summaryStats.lowestCalorieDay.date).toLocaleDateString('en-US', { 
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
                    <span className="text-lg font-bold">{summaryStats.lowestCalorieDay.calories} kcal</span>
                  </div>
                  <Progress 
                    value={(summaryStats.lowestCalorieDay.calories / userAnalyticsGoals.calories) * 100} 
                    className="h-2 [&>div]:bg-blue-500" 
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {Math.round(userAnalyticsGoals.calories - summaryStats.lowestCalorieDay.calories)} kcal under goal
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total days tracked</span>
                <span className="font-medium">{data.length}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Days on target</span>
                <span className="font-medium">{Math.round(data.length * summaryStats.goalAchievement / 100)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg. daily Iron</span>
                <span className="font-medium">{summaryStats.avgIron.toFixed(1)}mg</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg. daily Vitamin A</span>
                <span className="font-medium">{summaryStats.avgVitaminA.toFixed(0)}mcg</span>
              </div>
            </CardContent>
          </Card>
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
                  {Math.abs(trend)}%
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
                {p.value.toFixed(p.dataKey === 'iron' ? 1 : 0)}{p.unit || (p.dataKey === 'calories' ? ' kcal' : 'g')}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};
