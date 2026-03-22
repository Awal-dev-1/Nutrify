
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const activityLevels = [
  { id: 'low', label: 'Low', description: 'Little to no exercise' },
  { id: 'moderate', label: 'Moderate', description: 'Exercise 2-3 days/week' },
  { id: 'active', label: 'Active', description: 'Exercise 4-5 days/week' },
  { id: 'very-active', label: 'Very Active', description: 'Intense exercise daily' },
];

export function ActivityStep({ onNext }: { onNext: (data: any) => void }) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSubmit = () => {
    if (selected) {
      onNext({ activityLevel: selected });
    }
  };

  return (
    <div className="w-full max-w-md text-center">
      <h2 className="text-2xl font-bold mb-6">How active are you?</h2>
      <RadioGroup onValueChange={setSelected} className="space-y-2 text-left">
        {activityLevels.map(level => (
            <Label key={level.id} htmlFor={level.id} className="flex items-center p-4 border rounded-md cursor-pointer hover:bg-muted/50 has-[input:checked]:bg-primary/10 has-[input:checked]:border-primary">
                <RadioGroupItem value={level.id} id={level.id} className="mr-4" />
                <div>
                    <p className="font-medium">{level.label}</p>
                    <p className="text-sm text-muted-foreground">{level.description}</p>
                </div>
            </Label>
        ))}
      </RadioGroup>
      <div className="flex justify-end mt-8">
        <Button onClick={handleSubmit} disabled={!selected}>Next</Button>
      </div>
    </div>
  );
}
