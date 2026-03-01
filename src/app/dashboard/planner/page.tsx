import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function MealPlannerPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Meal Planner</h1>
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This page will feature a weekly grid layout for planning your meals, with options to generate a plan using AI.</p>
        </CardContent>
      </Card>
    </div>
  );
}
