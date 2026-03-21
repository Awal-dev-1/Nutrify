
import { Button } from "@/components/ui/button";

export function SummaryStep({ formData, onFinish }: { formData: any; onFinish: () => void }) {
  
  return (
    <div className="w-full text-center">
      <h2 className="text-2xl font-bold mb-6">Ready to go?</h2>
      <div className="text-left bg-muted/50 rounded-lg p-4 max-w-sm mx-auto space-y-2">
        <p><strong>Gender:</strong> <span className="capitalize">{formData.gender}</span></p>
        <p><strong>Age:</strong> {formData.age}</p>
        <p><strong>Height:</strong> {formData.heightCm} cm</p>
        <p><strong>Weight:</strong> {formData.weightKg} kg</p>
        <p><strong>Goal:</strong> <span className="capitalize">{formData.goal?.replace('-', ' ')}</span></p>
        <p><strong>Preferences:</strong> {formData.preferences?.join(', ')}</p>
        <p><strong>Activity Level:</strong> <span className="capitalize">{formData.activityLevel?.replace('-', ' ')}</span></p>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">Does this look right? You can always change this later in settings.</p>
      <div className="flex justify-end mt-8">
        <Button onClick={onFinish} size="lg">Finish Setup</Button>
      </div>
    </div>
  );
}
