'use client';

import type { FC } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import type { AIPrediction } from '@/types/ai';
import { cn } from '@/lib/utils';

interface PredictionCardProps {
  prediction: AIPrediction;
  onSelect: () => void;
}

export const PredictionCard: FC<PredictionCardProps> = ({ prediction, onSelect }) => {
  const confidencePercent = prediction.confidence * 100;

  const getConfidenceColor = () => {
    if (confidencePercent > 80) return 'bg-green-500';
    if (confidencePercent > 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="pb-3 sm:pb-4">
        {/* Title + badge: wrap on very small screens */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-base sm:text-lg leading-snug">
            {prediction.foodName}
          </CardTitle>
          <Badge
            variant={confidencePercent > 80 ? 'default' : 'secondary'}
            className={cn(
              'shrink-0 text-xs',
              confidencePercent > 80 &&
                'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800',
              confidencePercent <= 80 &&
                confidencePercent > 60 &&
                'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800',
              confidencePercent <= 60 &&
                'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800',
            )}
          >
            {confidencePercent.toFixed(0)}% Confident
          </Badge>
        </div>
        <CardDescription className="text-xs sm:text-sm">
          {prediction.calories.toFixed(0)} kcal / 100g
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-grow space-y-3 pb-3 sm:pb-4">
        {/* Confidence bar */}
        <Progress value={confidencePercent} className={cn('h-2', getConfidenceColor())} />

        {/* Macros grid — always 3 columns, text scales down on mobile */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
          <div className="p-1.5 sm:p-2 rounded-md bg-muted/50">
            <p className="text-xs text-muted-foreground">Protein</p>
            <p className="text-xs sm:text-sm font-semibold">
              {prediction.macronutrientBreakdown.protein.toFixed(1)}g
            </p>
          </div>
          <div className="p-1.5 sm:p-2 rounded-md bg-muted/50">
            <p className="text-xs text-muted-foreground">Carbs</p>
            <p className="text-xs sm:text-sm font-semibold">
              {prediction.macronutrientBreakdown.carbohydrates.toFixed(1)}g
            </p>
          </div>
          <div className="p-1.5 sm:p-2 rounded-md bg-muted/50">
            <p className="text-xs text-muted-foreground">Fat</p>
            <p className="text-xs sm:text-sm font-semibold">
              {prediction.macronutrientBreakdown.fat.toFixed(1)}g
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button className="w-full" size="sm" onClick={onSelect}>
          <Sparkles className="mr-2 h-4 w-4 shrink-0" /> Select this Food
        </Button>
      </CardFooter>
    </Card>
  );
};