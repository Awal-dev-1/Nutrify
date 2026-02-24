"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Zap, Scale, ChevronsUp, Heart } from 'lucide-react';

const goals = [
  { id: 'lose-weight', label: 'Lose Weight', icon: <Scale /> },
  { id: 'maintain-weight', label: 'Maintain Weight', icon: <Zap /> },
  { id: 'gain-weight', label: 'Gain Weight', icon: <ChevronsUp /> },
  { id: 'eat-healthier', label: 'Eat Healthier', icon: <Heart /> },
];

export function GoalsStep({ onNext }: { onNext: (data: any) => void }) {
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  const handleSelect = (goalId: string) => {
    setSelectedGoal(goalId);
  };

  const handleSubmit = () => {
    if (selectedGoal) {
      onNext({ goal: selectedGoal });
    }
  };

  return (
    <div className="w-full text-center">
      <h2 className="text-2xl font-bold mb-6">What's your primary goal?</h2>
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        {goals.map((goal) => (
          <Card
            key={goal.id}
            onClick={() => handleSelect(goal.id)}
            className={cn(
              "cursor-pointer transition-all",
              selectedGoal === goal.id ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md"
            )}
          >
            <CardContent className="p-4 flex flex-col items-center justify-center gap-2">
                <div className={cn("h-10 w-10 flex items-center justify-center rounded-full bg-muted", selectedGoal === goal.id && "bg-primary text-primary-foreground")}>
                    {goal.icon}
                </div>
              <span className="font-medium">{goal.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>
       <div className="flex justify-end mt-8">
        <Button onClick={handleSubmit} disabled={!selectedGoal}>Next</Button>
      </div>
    </div>
  );
}
