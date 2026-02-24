import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Upload } from "lucide-react";

export default function AiRecognitionPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">AI Food Recognition</h1>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Upload Your Meal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-muted-foreground/50 rounded-lg p-12 flex flex-col items-center justify-center text-center h-64 cursor-pointer hover:bg-muted/50">
            <Upload className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 font-semibold">Drag & Drop or click to upload</p>
            <p className="text-sm text-muted-foreground mt-1">PNG, JPG, or WEBP. Max 5MB.</p>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-4">This feature is currently under development.</p>
        </CardContent>
      </Card>
    </div>
  );
}
