import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function DailyTrackerPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Daily Tracker</h1>
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This page will display your logged meals for the day, structured by breakfast, lunch, dinner, and snacks, with real-time UI updates.</p>
        </CardContent>
      </Card>
    </div>
  );
}
