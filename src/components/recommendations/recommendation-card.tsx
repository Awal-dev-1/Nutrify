
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Flame, PlusCircle, ChefHat, HeartPulse } from 'lucide-react';
import type { Recommendation } from '@/services/recommendationService';
import { Button } from '../ui/button';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onViewDetails: () => void;
  onLog: () => void;
}

export function RecommendationCard({ recommendation, onViewDetails, onLog }: RecommendationCardProps) {
  const highestMacro = useMemo(() => {
    const macros = [
      { name: 'Protein', value: recommendation.protein },
      { name: 'Carbs', value: recommendation.carbs },
      { name: 'Fat', value: recommendation.fat },
    ];
    macros.sort((a, b) => b.value - a.value);
    if (macros[0].value > 0) {
      return `High in ${macros[0].name}`;
    }
    return null;
  }, [recommendation]);

  return (
    <Card className="flex flex-col h-full overflow-hidden border-2 rounded-2xl shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-3 rounded-full bg-gradient-to-br from-primary/10 to-primary/5">
                <Lightbulb className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-grow min-w-0">
                <CardTitle className="truncate text-lg">{recommendation.name}</CardTitle>
                <CardDescription className="text-xs italic truncate">
                    {recommendation.reason}
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="text-xs font-medium">
              <Flame className="h-3 w-3 mr-1 text-orange-500" />
              {recommendation.calories.toFixed(0)} kcal
            </Badge>
            {highestMacro && (
              <Badge variant="outline" className="text-xs font-medium">
                {highestMacro}
              </Badge>
            )}
          </div>
      </CardContent>
      <CardFooter className="bg-muted/30 p-3 flex-col sm:flex-row gap-2">
         <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={onViewDetails}>
            <ChefHat className="h-4 w-4 mr-2" />
            View Recipe
         </Button>
         <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={onViewDetails}>
            <HeartPulse className="h-4 w-4 mr-2" />
            Health Analysis
         </Button>
         <Button size="sm" className="w-full sm:w-auto sm:ml-auto" onClick={onLog}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add to Log
         </Button>
      </CardFooter>
    </Card>
  );
}
