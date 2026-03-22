"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const preferenceGroups = {
  "Common Diets": [
    'Vegetarian', 'Vegan', 'Pescatarian', 'Flexitarian', 'Omnivore (no restrictions)'
  ],
  "Health & Medical Diets": [
    'Gluten-Free', 'Lactose-Free / Dairy-Free', 'Low-Carb', 'Keto', 'Paleo', 'Low-Fat', 'Low-Sodium', 'Diabetic-Friendly', 'Heart-Healthy'
  ],
  "Allergies & Intolerances": [
    'Nut-Free', 'Peanut-Free', 'Shellfish-Free', 'Egg-Free', 'Soy-Free', 'Wheat-Free'
  ],
  "Religious & Cultural Diets": [
    'Halal', 'Kosher'
  ],
  "Lifestyle & Goals": [
    'High-Protein', 'Weight Loss Focused', 'Muscle Gain Focused', 'Clean Eating', 'Organic Only', 'Intermittent Fasting'
  ],
};

export function PreferencesStep({ onNext }: { onNext: (data: any) => void }) {
  const [selected, setSelected] = useState<string[]>([]);

  const handleSelect = (preference: string) => {
    if (preference === 'Omnivore (no restrictions)') {
      setSelected(['Omnivore (no restrictions)']);
      return;
    }
    setSelected(prev => {
      const newSelected = prev.filter(p => p !== 'Omnivore (no restrictions)');
      if (newSelected.includes(preference)) {
        return newSelected.filter(p => p !== preference);
      } else {
        return [...newSelected, preference];
      }
    });
  };

  const handleSubmit = () => {
    onNext({ preferences: selected.length === 0 ? ['Omnivore (no restrictions)'] : selected });
  };

  return (
    <div className="w-full text-center">
      <h2 className="text-2xl font-bold mb-2">Any dietary preferences?</h2>
      <p className="text-muted-foreground mb-6">Select all that apply. This helps us personalize your recommendations.</p>
      
      <Accordion type="multiple" defaultValue={['Common Diets']} className="max-w-lg mx-auto text-left">
        {Object.entries(preferenceGroups).map(([groupName, preferences]) => (
          <AccordionItem value={groupName} key={groupName}>
            <AccordionTrigger className="font-semibold">{groupName}</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-wrap gap-2 pt-2">
                {preferences.map((pref) => (
                  <Badge
                    key={pref}
                    onClick={() => handleSelect(pref)}
                    variant={selected.includes(pref) ? 'default' : 'secondary'}
                    className={cn(
                      "text-base px-4 py-2 cursor-pointer transition-all hover:scale-105",
                      selected.includes(pref) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {pref}
                  </Badge>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="flex justify-end mt-8">
        <Button onClick={handleSubmit}>Next</Button>
      </div>
    </div>
  );
}
