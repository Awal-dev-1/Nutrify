
'use client';

import { useState, useEffect, useMemo, type FC } from 'react';
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
  Salad,
  Target,
  TrendingUp,
  Award,
  AlertTriangle,
  Calendar,
  ChevronDown,
  Sparkles,
  Clock,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingDown,
  TrendingUp as TrendUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { MICRONUTRIENT_KEYS, NUTRIENT_LABELS, NUTRIENT_UNITS, MicronutrientKey } from '@/lib/nutrients';

type Timeframe = '7d' | '30d' | '90d';

const MicroAverageStat: FC<{ label: string; value: number; unit: string }> = ({
  label,
  value,
  unit,
}) => (
  <div className="p-2 sm:p-3 rounded-lg bg-muted/50 text-center transition-colors hover:bg-muted">
    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{label}</p>
    <p className="font-bold text-sm sm:text-base">
      {value.toFixed(1)} <span className="text-xs font-normal">{unit}</span>
    </p>
  </div>
);

const AverageMicronutrientCard: FC<{ summary: AnalyticsSummary }> = ({ summary }) => {
    const micros = MICRONUTRIENT_KEYS.map(key => {
        const summaryKey = `average${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof AnalyticsSummary;
        const value = (summary as any)[summaryKey] || 0;
        return {
            label: NUTRIENT_LABELS[key],
            value: value,
            unit: NUTRIENT_UNITS[key],
        }
    }).filter(m => m.value > 0);

    return (
        <Card className="border-2 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b pb-4">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Salad className="h-4 w-4 text-primary" />
                </div>
                Average Micronutrient Intake
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Your average daily values over the selected period.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 md:p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                {micros.map(micro => (
                    <MicroAverageStat key={micro.label} {...micro} />
                ))}
            </CardContent>
        </Card>
    );
};

const AnalyticsPage = () => {
  const { user } = useUser();
  const db = useFirestore();
  const [timeframe, setTimeframe] = useState<Timeframe>('30d');
  const [data, setData] = useState<{
    chartData: AnalyticsData[];
    summary: AnalyticsSummary;
    insights: string[];
    goals: { calories: number; protein: number; carbs: number; fat: number; iron: number; vitaminA: number; sodium: number; };
    loggedDaysCount: number;
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
      <div className="min-h-[60vh] flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md w-full mx-4 border-2">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="text-lg">Failed to load Analytics</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data || data.chartData.length === 0 || data.summary.averageCalories === 0) {
    return (
      <div className="min-h-[80vh] bg-gradient-to-b from-background to-secondary/5">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-8 space-y-6 md:space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-h1 font-bold tracking-tight text-primary">
                  Analytics & Insights
                </h1>
                <p className="text-body text-muted-foreground mt-0.5">
                  Your nutritional journey over the last {timeframe === '7d' ? '7' : timeframe === '30d' ? '30' : '90'} days
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-1 bg-muted rounded-lg w-full sm:w-auto">
              {(['7d', '30d', '90d'] as Timeframe[]).map((t) => (
                <Button
                  key={t}
                  variant={timeframe === t ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTimeframe(t)}
                  className={cn(
                    "capitalize flex-1 sm:flex-none",
                    timeframe === t && "shadow-md"
                  )}
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>

          <EmptyState
            icon={<PieChartIcon className="h-16 w-16 text-muted-foreground" />}
            title="Not enough data yet"
            description="Log your meals for a few days to unlock powerful analytics and personalized insights."
          >
            <Button 
              asChild 
              size="lg" 
              className="mt-4 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
            >
              <a href="/dashboard/tracker">
                <Activity className="mr-2 h-5 w-5" />
                Start Logging Meals
              </a>
            </Button>
          </EmptyState>
        </div>
      </div>
    );
  }

  const { chartData, summary, insights, goals, loggedDaysCount } = data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/5 pb-8 md:pb-12">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-8 space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-h1 font-bold tracking-tight text-primary">
                Analytics & Insights
              </h1>
              <p className="text-body text-muted-foreground mt-0.5">
                Your nutritional journey over the last {timeframe === '7d' ? '7' : timeframe === '30d' ? '30' : '90'} days
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-1 bg-muted rounded-lg w-full sm:w-auto">
            {(['7d', '30d', '90d'] as Timeframe[]).map((t) => (
              <Button
                key={t}
                variant={timeframe === t ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeframe(t)}
                className={cn(
                  "capitalize flex-1 sm:flex-none transition-all",
                  timeframe === t && "shadow-md"
                )}
              >
                {t}
              </Button>
            ))}
          </div>
        </div>

        {/* Summary Cards - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatCard 
            title="Avg. Daily Calories" 
            value={summary.averageCalories.toFixed(0)} 
            unit="kcal" 
            icon={<Activity className="h-4 w-4 text-primary" />}
            trend={summary.goalAchievementRate > 80 ? 'good' : summary.goalAchievementRate > 50 ? 'average' : 'low'}
          />
          <StatCard 
            title="Goal Achievement" 
            value={`${summary.goalAchievementRate.toFixed(0)}%`} 
            unit="of days" 
            icon={<Target className="h-4 w-4 text-chart-2" />}
            trend={summary.goalAchievementRate > 70 ? 'good' : summary.goalAchievementRate > 40 ? 'average' : 'low'}
          />
           <StatCard 
            title="Days Logged" 
            value={`${loggedDaysCount}`} 
            unit={loggedDaysCount === 1 ? 'day' : 'days'}
            icon={<Calendar className="h-4 w-4 text-chart-5" />}
          />
          <StatCard 
            title="Consistency Score" 
            value={`${summary.consistencyScore.toFixed(0)}%`} 
            unit="stability" 
            icon={<TrendingUp className="h-4 w-4 text-chart-1" />}
            trend={summary.consistencyScore > 70 ? 'good' : summary.consistencyScore > 40 ? 'average' : 'low'}
          />
        </div>

        {/* Main Chart */}
        <Card className="border-2 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
              Calorie Intake vs. Goal
            </CardTitle>
            <CardDescription className="text-sm">
              Your daily calorie consumption compared to your goal of {goals.calories} kcal
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 md:p-6">
            <div className="h-[250px] sm:h-[300px] md:h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(str) => format(new Date(str), 'MMM d')}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      padding: '8px 12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                    labelFormatter={(label) => format(new Date(label), 'EEEE, MMM d, yyyy')}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                    iconType="circle"
                  />
                  <Bar 
                    dataKey="calories" 
                    name="Calories" 
                    radius={[6, 6, 0, 0]} 
                    maxBarSize={50}
                  >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                    ))}
                  </Bar>
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
            </div>
          </CardContent>
        </Card>
        
        {/* Goal Comparison Section */}
        <Card className="border-2 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Target className="h-4 w-4 text-primary" />
              </div>
              Average Intake vs. Goals
            </CardTitle>
            <CardDescription className="text-sm">
              How your average daily intake compares to your targets
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-4 md:space-y-5">
            <GoalProgressBar 
              label="Calories" 
              value={summary.averageCalories} 
              goal={goals.calories} 
              unit="kcal" 
              color="var(--chart-1)"
            />
            <GoalProgressBar 
              label="Protein" 
              value={summary.averageProtein} 
              goal={goals.protein} 
              unit="g" 
              color="var(--chart-2)"
            />
            <GoalProgressBar 
              label="Carbs" 
              value={summary.averageCarbs} 
              goal={goals.carbs} 
              unit="g" 
              color="var(--chart-3)"
            />
            <GoalProgressBar 
              label="Fat" 
              value={summary.averageFat} 
              goal={goals.fat} 
              unit="g" 
              color="var(--chart-4)"
            />
          </CardContent>
        </Card>

        {/* Trend Charts - Responsive Grid */}
        <div className="grid grid-cols-1 gap-4 md:gap-6">
          {/* Macronutrient Trends */}
          <Card className="border-2 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b pb-4">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Beef className="h-4 w-4 text-primary" />
                </div>
                Macronutrient Trends
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Daily protein, carb, and fat intake
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 md:p-4">
              <div className="h-[250px] md:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(str) => format(new Date(str), 'MMM d')} 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      unit="g" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      width={30}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        fontSize: '11px',
                      }}
                      labelFormatter={(label) => format(new Date(label), 'MMM d, yyyy')}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }}
                      iconSize={8}
                    />
                    <Line type="monotone" dataKey="protein" name="Protein" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="carbs" name="Carbs" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="fat" name="Fat" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <AverageMicronutrientCard summary={summary} />

        </div>

        {/* Insights Grid - Responsive */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {summary.lowestCalorieDay && (
            <DaySummaryCard 
              day={summary.lowestCalorieDay} 
              title="Best Calorie Day" 
              icon={<Award className="h-4 w-4 text-chart-2" />} 
              variant="good"
            />
          )}
          {summary.highestCalorieDay && (
            <DaySummaryCard 
              day={summary.highestCalorieDay} 
              title="Highest Intake Day" 
              icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
              variant="bad"
            />
          )}
          
          {/* AI Insights Card */}
          <Card className="border-2 shadow-xl overflow-hidden md:col-span-2 lg:col-span-1">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b pb-4">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Lightbulb className="h-4 w-4 text-primary" />
                </div>
                AI-Generated Insights
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Actionable advice based on your data
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <ul className="space-y-3">
                {insights.map((insight, i) => (
                  <motion.li 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-2 text-xs md:text-sm"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{insight}</span>
                  </motion.li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Enhanced Stat Card Component
const StatCard = ({ title, value, unit, icon, trend }: { title: string; value: string; unit?: string; icon: React.ReactNode; trend?: 'good' | 'average' | 'low' }) => {
  const trendClasses = {
    good: { bg: 'bg-chart-2/10', text: 'text-chart-2' },
    average: { bg: 'bg-chart-4/10', text: 'text-chart-4' },
    low: { bg: 'bg-destructive/10', text: 'text-destructive' },
  };

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card className="border-2 shadow-lg hover:shadow-xl transition-all overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className={cn("p-1.5 rounded-lg", trend && trendClasses[trend].bg)}>
            {icon}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-h3 font-bold">
            {value}
            {unit && <span className="text-xs md:text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
          </div>
          {trend && (
            <div className="flex items-center gap-1 mt-1">
              {trend === 'good' && <TrendUp className="h-3 w-3 text-chart-2" />}
              {trend === 'low' && <TrendingDown className="h-3 w-3 text-destructive" />}
              <span className={cn("text-xs", trendClasses[trend].text)}>
                {trend === 'good' ? 'On track' : trend === 'average' ? 'Moderate' : 'Needs improvement'}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Enhanced Goal Progress Bar
const GoalProgressBar = ({ label, value, goal, unit, color }: { label: string; value: number; goal: number; unit: string; color: string }) => {
  const percentage = goal > 0 ? (value / goal) * 100 : 0;
  const isOver = percentage > 105;

  // Simplified color logic: use the provided color, but switch to destructive if over the goal.
  const indicatorColor = isOver ? 'hsl(var(--destructive))' : `hsl(${color})`;
  
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs md:text-sm">
        <span className="font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: `hsl(${color})` }} />
          {label}
        </span>
        <span className="text-muted-foreground">
          <span className="font-bold">{value.toFixed(0)}</span> / {goal.toFixed(0)} {unit}
        </span>
      </div>
      <div className="relative">
        <Progress 
          value={Math.min(100, percentage)} 
          className="h-2 md:h-2.5"
          indicatorStyle={{ backgroundColor: indicatorColor }}
        />
        {percentage > 100 && (
          <div className="absolute -top-4 right-0 text-xs text-destructive">
            +{(percentage - 100).toFixed(0)}% over
          </div>
        )}
      </div>
    </div>
  );
};


// Enhanced Day Summary Card
const DaySummaryCard = ({ day, title, icon, variant }: { day: AnalyticsData; title: string; icon: React.ReactNode; variant: 'good' | 'bad' }) => {
  const variantClasses = {
    good: 'text-chart-2',
    bad: 'text-destructive',
  }
  
  return (
    <Card className="border-2 shadow-lg hover:shadow-xl transition-all overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b pb-3">
        <CardTitle className={cn("flex items-center gap-2 text-sm md:text-base font-semibold", variantClasses[variant])}>
          {icon} {title}
        </CardTitle>
        <CardDescription className="text-xs flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {format(new Date(day.date), 'EEEE, MMM d, yyyy')}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-2 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">Calories</p>
            <p className="font-bold text-primary">{day.calories.toFixed(0)} kcal</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">Protein</p>
            <p className="font-bold text-chart-2">{day.protein.toFixed(0)}g</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">Carbs</p>
            <p className="font-bold text-chart-4">{day.carbs.toFixed(0)}g</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/30">
            <p className="font-bold text-chart-1">{day.fat.toFixed(0)}g</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Enhanced Analytics Skeleton
const AnalyticsSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-b from-background to-secondary/5 pb-8 md:pb-12 animate-pulse">
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-8 space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-10 w-48 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 md:h-32 rounded-xl" />)}
      </div>

      <Card className="border-2 shadow-lg">
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="p-6">
          <Skeleton className="h-[250px] sm:h-[300px] md:h-[350px] w-full" />
        </CardContent>
      </Card>

       <Card className="border-2 shadow-lg">
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
           <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 gap-4 md:gap-6">
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </CardHeader>
          <CardContent className="p-4">
            <Skeleton className="h-[250px] md:h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-3 sm:grid-cols-6 gap-2">
              {Array.from({ length: 18 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
              ))}
          </CardContent>
        </Card>
      </div>

    </div>
  </div>
);

export default AnalyticsPage;
