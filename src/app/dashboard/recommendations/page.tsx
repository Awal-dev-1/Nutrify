'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import {
  mockRecommendations,
  type Recommendation,
} from '@/lib/recommendations-data';
import { RecommendationCard } from '@/components/recommendations/recommendation-card';
import { RecipeModal } from '@/components/recommendations/recipe-modal';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<Recommendation | null>(null);

  const handleGenerate = () => {
    setIsLoading(true);
    setRecommendations([]); // Clear old recommendations
    setTimeout(() => {
      // Simulate fetching new recommendations
      setRecommendations(mockRecommendations);
      setIsLoading(false);
    }, 1500);
  };

  const handleSelectRecommendation = (rec: Recommendation) => {
    setSelected(rec);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Your Personalized Recommendations</h1>
        <p className="text-muted-foreground mt-1">
          Click the button to get new meal suggestions tailored to your goals.
        </p>
      </div>

      <Card>
        <CardContent className="p-6 text-center">
            <h2 className="text-lg font-semibold">Ready for new ideas?</h2>
            <p className="text-muted-foreground text-sm mb-4">Our AI will analyze your recent activity to suggest what to eat next.</p>
            <Button size="lg" onClick={handleGenerate} disabled={isLoading}>
                {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                <Sparkles className="mr-2 h-4 w-4" />
                )}
                Generate AI Recommendations
            </Button>
        </CardContent>
      </Card>


      {isLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-8 w-full" />
                </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && recommendations.length === 0 && (
        <EmptyState
            icon={<Sparkles className="h-16 w-16 text-muted-foreground" />}
            title="Generate your first recommendations"
            description="Click the button above to get started with personalized meal ideas."
        />
      )}

      {!isLoading && recommendations.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((rec) => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              onSelect={() => handleSelectRecommendation(rec)}
            />
          ))}
        </div>
      )}

      <RecipeModal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        recommendation={selected}
      />
    </div>
  );
}
