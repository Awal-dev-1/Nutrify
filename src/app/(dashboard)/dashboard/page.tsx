"use client";

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
  ArrowRight,
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
} from "lucide-react";
import Link from "next/link";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";

const summaryData = [
  {
    title: "Calories",
    value: 1530,
    goal: 2200,
    unit: "kcal",
    icon: <Flame className="h-5 w-5 text-orange-500" />,
    color: "hsl(var(--primary))",
  },
  {
    title: "Protein",
    value: 80,
    goal: 120,
    unit: "g",
    icon: <Beef className="h-5 w-5 text-red-500" />,
    color: "hsl(var(--chart-2))",
  },
  {
    title: "Carbs",
    value: 200,
    goal: 250,
    unit: "g",
    icon: <Wheat className="h-5 w-5 text-yellow-600" />,
    color: "hsl(var(--chart-3))",
  },
  {
    title: "Fat",
    value: 50,
    goal: 70,
    unit: "g",
    icon: <Droplets className="h-5 w-5 text-blue-500" />,
    color: "hsl(var(--chart-4))",
  },
  {
    title: "Iron",
    value: 12,
    goal: 18,
    unit: "mg",
    icon: <Activity className="h-5 w-5 text-rose-700" />,
    color: "hsl(var(--chart-5))",
  },
  {
    title: "Vitamin A",
    value: 600,
    goal: 900,
    unit: "mcg",
    icon: <Eye className="h-5 w-5 text-green-500" />,
    color: "hsl(var(--chart-1))",
  },
];

const getStatus = (
  value: number,
  goal: number
): { text: string; variant: "default" | "secondary" | "destructive" } => {
  const percentage = (value / goal) * 100;
  if (percentage < 85) return { text: "Below target", variant: "destructive" };
  if (percentage <= 115) return { text: "On target", variant: "default" };
  return { text: "Above target", variant: "secondary" };
};

const macroData = [
  { name: "Protein", value: 80, color: "hsl(var(--chart-2))" },
  { name: "Carbs", value: 200, color: "hsl(var(--chart-3))" },
  { name: "Fat", value: 50, color: "hsl(var(--chart-4))" },
];

const microData = [
  { name: "Iron", value: 12, goal: 18, unit: "mg" },
  { name: "Vitamin A", value: 600, goal: 900, unit: "mcg" },
  { name: "Calcium", value: 700, goal: 1000, unit: "mg" },
];

const weeklyChartData = [
  { day: "Mon", calories: 2000 },
  { day: "Tue", calories: 2150 },
  { day: "Wed", calories: 1800 },
  { day: "Thu", calories: 2300 },
  { day: "Fri", calories: 1900 },
  { day: "Sat", calories: 2500 },
  { day: "Sun", calories: 1530 },
];

const quickActions = [
  { href: "/dashboard/tracker", label: "Add Meal", icon: PlusCircle },
  { href: "/dashboard/search", label: "Search Food", icon: Search },
  { href: "/dashboard/goals", label: "Update Goals", icon: Target },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/dashboard/planner", label: "Meal Planner", icon: Calendar },
  { href: "/dashboard/recommendations", label: "Recommendations", icon: Bot },
];

export default function DashboardPage() {
  return (
    <div className="grid gap-6">
      {/* 1. Daily Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {summaryData.map((card) => {
          const status = getStatus(card.value, card.goal);
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                {card.icon}
              </CardHeader>
              <CardContent className="pb-2">
                <div className="text-2xl font-bold">
                  {card.value}{" "}
                  <span className="text-base font-normal text-muted-foreground">
                    / {card.goal}
                    {card.unit}
                  </span>
                </div>
                <Progress
                  value={(card.value / card.goal) * 100}
                  className="mt-2 h-2"
                />
              </CardContent>
              <CardFooter className="pt-0 pb-4">
                <Badge variant={status.variant} className="text-xs">
                  {status.text}
                </Badge>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* 3. Nutrient Progress Section */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Nutrient Progress</CardTitle>
              <CardDescription>
                Macronutrient distribution and micronutrient intake.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-md font-medium mb-2 text-center">
                  Macronutrients
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={macroData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {macroData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                <h3 className="text-md font-medium mb-2">
                  Micronutrient Highlights
                </h3>
                {microData.map((micro) => {
                  const status = getStatus(micro.value, micro.goal);
                  return (
                    <div key={micro.name}>
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-medium">{micro.name}</p>
                        <Badge variant={status.variant} className="text-xs">
                          {status.text}
                        </Badge>
                      </div>
                      <Progress
                        value={(micro.value / micro.goal) * 100}
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground text-right mt-1">
                        {micro.value} / {micro.goal} {micro.unit}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* 6. Smart Tips Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Smart Tips & Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <GlassWater className="h-5 w-5 mt-1 text-blue-500 flex-shrink-0" />
                <p className="text-sm">
                  Hydration reminder: Drink a glass of water now to stay on
                  track for your daily goal.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Leaf className="h-5 w-5 mt-1 text-green-500 flex-shrink-0" />
                <p className="text-sm">
                  Protein intake appears low. Consider adding a handful of nuts
                  or a portion of beans to your next snack.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Activity className="h-5 w-5 mt-1 text-red-500 flex-shrink-0" />
                <p className="text-sm">
                  Your iron intake is a bit below the target. Green leafy
                  vegetables like spinach are a great source.
                </p>
              </div>
              <CardDescription className="text-xs italic pt-2">
                Guidance based on sample data.
              </CardDescription>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/dashboard/recommendations">
                  More Recommendations{" "}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* 7. Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <Button variant="outline" asChild key={action.href}>
                  <Link href={action.href}>
                    <action.icon className="mr-2" /> {action.label}
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 5. Weekly Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Calorie Trend</CardTitle>
          <CardDescription>
            Your calorie intake for the last 7 days. Mock data for visual trend
            only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weeklyChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={10} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="calories"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 4, fill: "hsl(var(--primary))" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 8. Footer */}
      <div className="text-center text-sm text-muted-foreground py-4">
        <p>Remember: A balanced plate is a happy plate!</p>
      </div>
    </div>
  );
}
