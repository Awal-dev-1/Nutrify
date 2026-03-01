'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Recommendation } from '@/lib/recommendations-data';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onSelect: () => void;
}

export function RecommendationCard({ recommendation, onSelect }: RecommendationCardProps) {
  const { toast } = useToast();

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent modal from opening
    toast({
      title: 'Added to Tracker!',
      description: `${recommendation.name} has been added to your lunch.`,
    });
  };

  return (
    <Card
      className="overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer h-full flex flex-col"
      onClick={onSelect}
    >
      <CardHeader>
        <CardTitle>{recommendation.name}</CardTitle>
        <div className="flex flex-wrap gap-2 pt-1">
          {recommendation.tags.map((tag) => (
            <Badge key={tag} variant="outline">{tag}</Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-md text-sm text-primary/80">
            <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>{recommendation.reason}</p>
        </div>
        <div className="mt-4">
            <h4 className="font-semibold mb-2">Recipe Preview</h4>
            <p className="text-sm text-muted-foreground line-clamp-3">
                {recommendation.recipe.instructions.join(' ')}
            </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={handleQuickAdd}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add to Tracker
        </Button>
      </CardFooter>
    </Card>
  );
}
