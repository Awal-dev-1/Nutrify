'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Flame, ArrowRight } from 'lucide-react';
import type { Recommendation } from '@/services/recommendationService';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onClick: () => void;
}

export function RecommendationCard({ recommendation, onClick }: RecommendationCardProps) {
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
    <Card
      onClick={onClick}
      className="cursor-pointer overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 h-full flex flex-col border-2 rounded-2xl group"
    >
      <div className="flex-grow p-4 flex items-center gap-4">
        {/* Left Icon */}
        <div className="flex-shrink-0 p-3 rounded-full bg-gradient-to-br from-primary/10 to-primary/5">
          <Lightbulb className="h-6 w-6 text-primary" />
        </div>

        {/* Center Content */}
        <div className="flex-grow min-w-0">
          <h3 className="font-bold truncate">{recommendation.name}</h3>
          <p className="text-xs text-muted-foreground italic truncate">
            {recommendation.reason}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
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
        </div>
        
        {/* Right Arrow */}
        <div className="flex-shrink-0">
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-1" />
        </div>
      </div>
    </Card>
  );
}
