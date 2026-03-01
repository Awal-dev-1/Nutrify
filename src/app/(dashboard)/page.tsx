'use client';

import { useMemo, useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  Search,
  Bot,
  Flame,
  Beef,
  Wheat,
  Droplets,
  Eye,
  Target,
  BarChart2,
  Calendar,
  Activity,
  GlassWater,
  Leaf,
  TrendingUp,
  Award,
  ChevronRight,
  Zap,
  Clock,
  ClipboardX,
} from "lucide-react";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useDoc, useUser, useFirestore, useMemoFirebase } from "@/firebase";
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { format, subDays } from "date-fns";
import type { DailyLog } from "@/types/analytics";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

const quickActions = [
  { href: "/dashboard/tracker", label: "Add Meal", icon: PlusCircle, color: "text-primary" },
  { href: "/dashboard/search", label: "AI Food Search", icon: Search, color: "text-blue-500" },
  { href: "/dashboard/goals", label: "Update Goals", icon: Target, color: "text-green-500" },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart2, color: "text-purple-500" },
  { href: "/dashboard/planner", label: "Meal Planner", icon: Calendar, color: "text-orange-500" },
  { href: "/dashboard/recognize", label: "AI Recognition", icon: Bot, color: "text-indigo-500" },
];

const getStatus = (
  value: number,
  goal: number
): { text: string; color: string } => {
  if (goal === 0) return { text: "No goal", color: "text-muted-foreground" };
  const percentage = (value / goal) * 100;
  if (percentage < 70) return { text: "Behind", color: "text-destructive" };
  if (percentage <= 110) return { text: "On track", color: "text-primary" };
  return { text: "Exceeded", color: "text-yellow-500" };
};

const DashboardSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-80" />
      </div>
      <Skeleton className="h-12 w-48 rounded-lg" />
    </div>
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-40 rounded-lg" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Skeleton className="h-96 rounded-lg" />
      <div className="space-y-8">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const { user, userProfile, isUserLoading, isProfileLoading } = useUser();
  const db = useFirestore();
  const [weeklyData, setWeeklyData] = useState<DailyLog[]>([]);
  const [isWeeklyLoading, setIsWeeklyLoading] = useState(true);

  const todayKey = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const dailyLogRef = useMemoFirebase(
    () => (user ? doc(db, "users", user.uid, "dailyLogs", todayKey) : null),
    [user, db, todayKey]
  );
  const { data: dailyLog, isLoading: isLogLoading } = useDoc<DailyLog>(dailyLogRef);

  useEffect(() => {
    if (!user || !db) return;
    const fetchWeeklyData = async () => {
      setIsWeeklyLoading(true);
      const sevenDaysAgo = format(subDays(new Date(), 6), "yyyy-MM-dd");
      const logsQuery = query(
        collection(db, "users", user.uid, "dailyLogs"),
        where("__name__", ">=", sevenDaysAgo),
        orderBy("__name__", "asc"),
        limit(7)
      );
      try {
        const snapshot = await getDocs(logsQuery);
        const logs = snapshot.docs.map(doc => doc.data() as DailyLog);
        setWeeklyData(logs);
      } catch (error) {
        console.error("Failed to fetch weekly data:", error);
      } finally {
        setIsWeeklyLoading(false);
      }
    };
    fetchWeeklyData();
  }, [user, db]);

  if (isUserLoading || isProfileLoading || isLogLoading) {
    return <DashboardSkeleton />;
  }

  // Use the fetched dailyLog, or a default zero-state object if no log exists.
  const currentLog = dailyLog || {
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    waterIntake: 0,
  };

  const goals = userProfile?.goals;
  const calorieGoal = goals?.dailyCalorieGoal || 0;
  const proteinGoal = goals ? (calorieGoal * (goals.proteinPercentageGoal / 100)) / 4 : 0;
  const carbsGoal = goals ? (calorieGoal * (goals.carbsPercentageGoal / 100)) / 4 : 0;
  const fatGoal = goals ? (calorieGoal * (goals.fatPercentageGoal / 100)) / 9 : 0;

  const summaryData = [
    { title: "Calories", value: currentLog.totalCalories, goal: calorieGoal, unit: "kcal", icon: <Flame className="h-5 w-5 text-orange-500" />, color: "hsl(var(--primary))", bgColor: "bg-orange-50 dark:bg-orange-950/20" },
    { title: "Protein", value: currentLog.totalProtein, goal: proteinGoal, unit: "g", icon: <Beef className="h-5 w-5 text-red-500" />, color: "hsl(var(--chart-2))", bgColor: "bg-red-50 dark:bg-red-950/20" },
    { title: "Carbs", value: currentLog.totalCarbs, goal: carbsGoal, unit: "g", icon: <Wheat className="h-5 w-5 text-yellow-600" />, color: "hsl(var(--chart-3))", bgColor: "bg-yellow-50 dark:bg-yellow-950/20" },
    { title: "Fat", value: currentLog.totalFat, goal: fatGoal, unit: "g", icon: <Droplets className="h-5 w-5 text-blue-500" />, color: "hsl(var(--chart-4))", bgColor: "bg-blue-50 dark:bg-blue-950/20" },
  ];

  const overallProgress = goals ? (summaryData.reduce((acc, item) => item.goal > 0 ? acc + Math.min(100, (item.value / item.goal) * 100) : acc, 0) / summaryData.filter(item => item.goal > 0).length) : 0;

  const macroData = [
    { name: "Protein", value: currentLog.totalProtein, color: "hsl(var(--chart-2))" },
    { name: "Carbs", value: currentLog.totalCarbs, color: "hsl(var(--chart-3))" },
    { name: "Fat", value: currentLog.totalFat, color: "hsl(var(--chart-4))" },
  ];

  const weeklyChartData = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateKey = format(date, 'E');
    const log = weeklyData.find(l => l.date === format(date, 'yyyy-MM-dd'));
    return {
      day: dateKey,
      calories: log?.totalCalories || 0,
      goal: calorieGoal,
    };
  });
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {userProfile?.name}!</h1>
          <p className="text-muted-foreground">
            Here's your nutrition summary for today, {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-lg">
            <Award className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Overall Progress</p>
              <p className="text-lg font-bold">{overallProgress.toFixed(0)}%</p>
            </div>
          </div>
          <Badge variant="outline" className="px-3 py-1.5">
            <Clock className="h-4 w-4 mr-1.5" /> Real-Time
          </Badge>
        </div>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-4">
        {summaryData.map((card) => {
          const status = getStatus(card.value, card.goal);
          const percentage = card.goal > 0 ? Math.min((card.value / card.goal) * 100, 100) : 0;
          return (
            <Card key={card.title} className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-1.5 w-full" style={{ background: card.color + '20' }} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn("p-2 rounded-lg", card.bgColor)}>{card.icon}</div>
                  <Badge variant="outline" className={cn("text-xs", status.color)}>{status.text}</Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  {card.goal > 0 ? (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">{Math.round(card.value)}</span>
                        <span className="text-sm text-muted-foreground">/ {Math.round(card.goal)}{card.unit}</span>
                      </div>
                      <Progress value={percentage} className="h-1.5" style={{ '--progress-background': card.color } as React.CSSProperties} />
                    </>
                  ) : (
                    <div className="text-center py-2">
                        <p className="text-xs text-muted-foreground">Goal not set</p>
                        <Button variant="link" size="sm" asChild className="h-auto p-0"><Link href="/dashboard/goals">Set Goal</Link></Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/5">
              <CardTitle>Nutrient Breakdown</CardTitle>
              <CardDescription>Macronutrient distribution for today</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={macroData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} cornerRadius={4}>
                    {macroData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-3 gap-2 mt-4">
                {macroData.map((item) => (
                  <div key={item.name} className="text-center p-2 rounded-lg bg-muted/30">
                    <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ background: item.color }} />
                    <p className="text-xs font-medium">{item.name}</p>
                    <p className="text-sm font-bold">{Math.round(item.value)}g</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden">
             <CardHeader className="border-b bg-muted/5">
                <CardTitle>Weekly Calorie Trend</CardTitle>
                <CardDescription>Last 7 days vs. daily goal</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                {isWeeklyLoading ? <Skeleton className="h-[280px] w-full" /> : weeklyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={weeklyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs><linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={10} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                            <YAxis tickLine={false} axisLine={false} tickMargin={10} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }} />
                            <Area type="monotone" dataKey="calories" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorCalories)" />
                            {calorieGoal > 0 && <Line type="monotone" dataKey="goal" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />}
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-[280px] flex items-center justify-center text-center">
                        <div>
                            <p className="font-medium">No analytics available yet</p>
                            <p className="text-sm text-muted-foreground">Start logging meals to see your insights.</p>
                        </div>
                    </div>
                )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-background to-primary/5">
            <CardHeader className="border-b border-primary/10">
              <CardTitle className="flex items-center gap-2"><div className="p-2 rounded-full bg-primary/10"><Zap className="h-5 w-5 text-primary" /></div>Smart Insights</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20"><GlassWater className="h-5 w-5 mt-0.5 text-blue-500 flex-shrink-0" /><div><p className="text-sm font-medium">Hydration Reminder</p><p className="text-xs text-muted-foreground">Drink a glass of water now to stay on track for your daily goal.</p></div></div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20"><Leaf className="h-5 w-5 mt-0.5 text-green-500 flex-shrink-0" /><div><p className="text-sm font-medium">Protein Low</p><p className="text-xs text-muted-foreground">Add a handful of nuts or a portion of beans to your next snack.</p></div></div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20"><Activity className="h-5 w-5 mt-0.5 text-rose-500 flex-shrink-0" /><div><p className="text-sm font-medium">Iron Alert</p><p className="text-xs text-muted-foreground">Green leafy vegetables like spinach are a great source.</p></div></div>
            </CardContent>
            <CardFooter className="border-t bg-muted/5 p-4"><Button variant="ghost" size="sm" className="w-full justify-between" asChild><Link href="/dashboard/recommendations">View All Recommendations<ChevronRight className="h-4 w-4" /></Link></Button></CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {quickActions.map((action) => (
                <Button variant="outline" asChild key={action.href} className="h-auto py-3 px-2 justify-start hover:border-primary/50 hover:bg-primary/5 transition-all">
                  <Link href={action.href}><action.icon className={cn("mr-2 h-4 w-4", action.color)} /><span className="text-xs sm:text-sm">{action.label}</span></Link>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-muted/50 to-background">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Today's Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Remaining calories</span><span className="font-bold text-lg">{Math.round(calorieGoal - currentLog.totalCalories)} kcal</span></div>
              <Progress value={calorieGoal > 0 ? (currentLog.totalCalories / calorieGoal) * 100 : 0} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground pt-2"><span>Consumed: {Math.round(currentLog.totalCalories)} kcal</span><span>Goal: {Math.round(calorieGoal)} kcal</span></div>
              <Separator />
              <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Water intake</span><span className="font-medium">{currentLog.waterIntake || 0} / 8 glasses</span></div>
              <Progress value={currentLog.waterIntake ? (currentLog.waterIntake / 8) * 100 : 0} className="h-2 [&>div]:bg-blue-500" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}