"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const preferences = [
  'Vegan', 'Vegetarian', 'Halal', 'Diabetic-Friendly', 'None'
];

export function PreferencesStep({ onNext }: { onNext: (data: any) => void }) {
  const [selected, setSelected] = useState<string[]>([]);

  const handleSelect = (preference: string) => {
    if (preference === 'None') {
      setSelected(['None']);
      return;
    }
    setSelected(prev => {
      const newSelected = prev.filter(p => p !== 'None');
      if (newSelected.includes(preference)) {
        return newSelected.filter(p => p !== preference);
      } else {
        return [...newSelected, preference];
      }
    });
  };

  const handleSubmit = () => {
    onNext({ preferences: selected });
  };

  return (
    <div className="w-full text-center">
      <h2 className="text-2xl font-bold mb-2">Any dietary preferences?</h2>
      <p className="text-muted-foreground mb-6">Select all that apply.</p>
      <div className="flex flex-wrap gap-3 justify-center max-w-md mx-auto">
        {preferences.map((pref) => (
          <Badge
            key={pref}
            onClick={() => handleSelect(pref)}
            variant={selected.includes(pref) ? 'default' : 'secondary'}
            className={cn("text-base px-4 py-2 cursor-pointer transition-all", selected.includes(pref) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80")}
          >
            {pref}
          </Badge>
        ))}
      </div>
      <div className="flex justify-end mt-8">
        <Button onClick={handleSubmit} disabled={selected.length === 0}>Next</Button>
      </div>
    </div>
  );
}
