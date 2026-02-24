import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowRight, PlusCircle, Search, Scan } from "lucide-react";
import Link from "next/link";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

const summaryCards = [
  { title: "Calories Consumed", value: "1,530", goal: "2,200", unit: "kcal", progress: 69, color: "bg-green-500" },
  { title: "Protein", value: "80", goal: "120", unit: "g", progress: 66, color: "bg-blue-500" },
  { title: "Carbs", value: "200", goal: "250", unit: "g", progress: 80, color: "bg-orange-500" },
  { title: "Fat", value: "50", goal: "70", unit: "g", progress: 71, color: "bg-yellow-500" },
];

const chartData = [
  { day: "Mon", calories: 2000 },
  { day: "Tue", calories: 2150 },
  { day: "Wed", calories: 1800 },
  { day: "Thu", calories: 2300 },
  { day: "Fri", calories: 1900 },
  { day: "Sat", calories: 2500 },
  { day: "Sun", calories: 1530 },
];

const chartConfig = {
  calories: {
    label: "Calories",
    color: "hsl(var(--primary))",
  },
};

export default function DashboardPage() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <CardHeader>
              <CardTitle className="text-base font-medium">{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{card.value} <span className="text-lg font-normal text-muted-foreground">/ {card.goal}{card.unit}</span></div>
              <Progress value={card.progress} className="mt-2 h-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Calorie Chart</CardTitle>
            <CardDescription>Your calorie intake for the last 7 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="calories" fill="var(--color-calories)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Smart Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm">💡 Your iron intake is 20% below recommended levels. Try adding some spinach or lentils.</p>
                <p className="text-sm">🎉 Great job on hitting your protein goal 3 times this week!</p>
              </div>
            </CardContent>
             <CardFooter>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/dashboard/analytics">View All Insights <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-2">
              <Button variant="outline" asChild>
                <Link href="/dashboard/tracker"><PlusCircle /> Add Meal</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/search"><Search /> Search</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/recognize"><Scan /> Scan</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
