import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function GoalsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Manage Your Goals</h1>
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This page will allow you to set and adjust your daily calorie goals, macro percentages, and micronutrient targets.</p>
        </CardContent>
      </Card>
    </div>
  );
}
