'use client';

import { useRouter } from 'next/navigation';
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
import { Lightbulb, PlusCircle, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Recommendation } from '@/services/recommendationService';

interface RecommendationCardProps {
  recommendation: Recommendation;
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const { toast } = useToast();
  const router = useRouter();

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    toast({
      title: 'Added to Tracker!',
      description: `${recommendation.name} has been added to your lunch.`,
    });
  };

  const handleSelect = () => {
    router.push(`/dashboard/food/${recommendation.id}`);
  };

  return (
    <Card
      className="overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer h-full flex flex-col border-2"
      onClick={handleSelect}
    >
      <CardHeader>
        <CardTitle>{recommendation.name}</CardTitle>
        <CardDescription>{recommendation.calories} kcal per 100g</CardDescription>
        <div className="flex flex-wrap gap-2 pt-1">
          {recommendation.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline">{tag}</Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-md text-sm text-primary/80">
            <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>{recommendation.reason}</p>
        </div>
      </CardContent>
      <CardFooter className="flex-col sm:flex-row gap-2">
        <Button className="w-full" onClick={handleQuickAdd}>
          <PlusCircle className="mr-2 h-4 w-4" /> Quick Add
        </Button>
         <Button variant="secondary" className="w-full" onClick={handleSelect}>
           Details <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
