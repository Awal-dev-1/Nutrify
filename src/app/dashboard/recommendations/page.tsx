'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Salad, ChefHat, Clock, TrendingUp } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import {
  mockRecommendations,
  type Recommendation,
} from '@/lib/recommendations-data';
import { RecommendationCard } from '@/components/recommendations/recommendation-card';
import { RecipeModal } from '@/components/recommendations/recipe-modal';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

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
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
            <ChefHat className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Personalized Recommendations</h1>
            <p className="text-muted-foreground max-w-2xl">
              Get AI-powered meal suggestions tailored to your goals, preferences, and past activity.
            </p>
          </div>
        </div>

        {/* Quick Stats - Optional decorative element */}
        <div className="flex flex-wrap gap-3">
          <Badge variant="secondary" className="px-3 py-1.5">
            <TrendingUp className="h-3.5 w-3.5 mr-1.5" /> Based on your goals
          </Badge>
          <Badge variant="secondary" className="px-3 py-1.5">
            <Clock className="h-3.5 w-3.5 mr-1.5" /> Updated daily
          </Badge>
        </div>
      </div>

      {/* Generate Card */}
      <Card className="border-2 bg-gradient-to-br from-background to-muted/30 overflow-hidden">
        <CardContent className="p-8 text-center relative">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative">
            <div className="inline-flex p-3 rounded-full bg-primary/10 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Ready for new ideas?</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Our AI will analyze your recent activity, goals, and preferences to suggest personalized meals.
            </p>
            <Button 
              size="lg" 
              onClick={handleGenerate} 
              disabled={isLoading}
              className="min-w-[250px] h-12 text-base shadow-lg hover:shadow-xl transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Ideas...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate AI Recommendations
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Salad className="h-5 w-5 text-primary" />
              Crafting your recommendations...
            </h3>
            <span className="text-sm text-muted-foreground">This may take a moment</span>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && recommendations.length === 0 && (
        <EmptyState
          icon={<Salad className="h-16 w-16 text-muted-foreground" />}
          title="No recommendations yet"
          description="Generate your first personalized meal suggestions to discover new dishes tailored to you."
          className="border-2 border-dashed"
        >
          <Button onClick={handleGenerate} size="lg" variant="outline" className="mt-4">
            <Sparkles className="mr-2 h-4 w-4" /> Get Started
          </Button>
        </EmptyState>
      )}

      {/* Recommendations Grid */}
      {!isLoading && recommendations.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Your Personalized Picks</h3>
              <Badge variant="secondary" className="ml-2">
                {recommendations.length} suggestions
              </Badge>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleGenerate}
              className="text-muted-foreground hover:text-foreground"
            >
              <Sparkles className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((rec, index) => (
              <div key={rec.id} className="relative group">
                {index === 0 && (
                  <Badge className="absolute -top-2 -right-2 z-10 bg-primary shadow-lg">
                    Top Pick
                  </Badge>
                )}
                <RecommendationCard
                  recommendation={rec}
                  onSelect={() => handleSelectRecommendation(rec)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recipe Modal */}
      <RecipeModal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        recommendation={selected}
      />
    </div>
  );
}