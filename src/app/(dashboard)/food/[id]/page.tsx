import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function FoodDetailsPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Food Details: {params.id}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This page will show a detailed breakdown of the selected food item, including a nutrient distribution chart and portion selector.</p>
        </CardContent>
      </Card>
    </div>
  );
}
