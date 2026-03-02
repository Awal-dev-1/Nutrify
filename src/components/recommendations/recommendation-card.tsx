'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, PlusCircle, BookOpen } from 'lucide-react';
import type { Recommendation } from '@/services/recommendationService';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onViewRecipe: () => void;
  onAddToCart: () => void;
}

export function RecommendationCard({ recommendation, onViewRecipe, onAddToCart }: RecommendationCardProps) {
  
  return (
    <Card
      className="overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 h-full flex flex-col border-2"
    >
      <CardHeader>
        <CardTitle>{recommendation.name}</CardTitle>
        <CardDescription>{recommendation.calories.toFixed(0)} kcal per 100g</CardDescription>
        <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant="outline" className="border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                {recommendation.protein.toFixed(0)}g Protein
            </Badge>
             <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300">
                {recommendation.carbs.toFixed(0)}g Carbs
            </Badge>
             <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
                {recommendation.fat.toFixed(0)}g Fat
            </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-md text-sm text-primary/80">
            <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>{recommendation.reason}</p>
        </div>
      </CardContent>
      <CardFooter className="flex-col sm:flex-row gap-2">
        <Button variant="secondary" className="w-full" onClick={onViewRecipe}>
           <BookOpen className="mr-2 h-4 w-4" /> View Recipe
        </Button>
        <Button className="w-full" onClick={onAddToCart}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add to Tracker
        </Button>
      </CardFooter>
    </Card>
  );
}
