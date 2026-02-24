import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function RecommendationsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Smart Recommendations</h1>
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This page will provide personalized food and meal recommendations based on your goals and tracking history.</p>
        </CardContent>
      </Card>
    </div>
  );
}
