'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Salad, RefreshCw, Flame } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { RecommendationCard } from '@/components/recommendations/recommendation-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { getRecommendations } from '@/services/recommendationService';
import type { RecommendationResult } from '@/services/recommendationService';
import { useUser, useFirestore } from '@/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

export default function RecommendationsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [data, setData] = useState<RecommendationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    if (!user || !db) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getRecommendations(db, user.uid);
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch recommendations.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const SummaryCard = () => {
    if (!data) return null;
    const { calorieRemaining, goals } = data;
    const consumed = goals.calories - calorieRemaining;
    const progress = (consumed / goals.calories) * 100;
  
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Today's Calorie Status</CardTitle>
          <CardDescription>Based on your goal of {goals.calories} kcal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
           <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
                <Flame className="h-4 w-4 text-orange-500" />
                <span>Remaining</span>
            </div>
            <span className="text-xl font-bold">{Math.round(calorieRemaining)} kcal</span>
          </div>
          <Progress value={progress} />
           <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Consumed: {Math.round(consumed)} kcal</span>
            <span>Goal: {goals.calories} kcal</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <div className="flex gap-2 pt-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    if (!data) {
      return (
        <EmptyState
          icon={<Sparkles className="h-16 w-16 text-muted-foreground" />}
          title="Generate Meal Recommendations"
          description="Click the button to get AI-powered meal suggestions based on your goals and today's intake."
          className="border-2 border-dashed"
        >
          <Button onClick={fetchRecommendations} size="lg" disabled={isLoading}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Recommendations
          </Button>
        </EmptyState>
      );
    }

    if (data.recommendations.length === 0) {
      return (
        <EmptyState
          icon={<Salad className="h-16 w-16 text-muted-foreground" />}
          title="No recommendations for now"
          description="We couldn't find any suitable recommendations. Try logging more meals or adjusting your goals."
          className="border-2 border-dashed"
        >
        </EmptyState>
      );
    }
    
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data.recommendations.map((rec, index) => (
          <div key={rec.id} className="relative group">
            {rec.matchScore > 150 && (
              <Badge className="absolute -top-2 -right-2 z-10 bg-primary shadow-lg">
                Top Pick
              </Badge>
            )}
            <RecommendationCard
              recommendation={rec}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">AI Recommendations</h1>
            <p className="text-muted-foreground max-w-2xl">
              Smart meal suggestions tailored to your goals and today's intake.
            </p>
        </div>
        {data && (
            <Button variant="outline" onClick={fetchRecommendations} disabled={isLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Regenerate
            </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Your Personalized Picks</h3>
                {data && (
                    <Badge variant="secondary" className="ml-2">
                        {data.recommendations.length} suggestions
                    </Badge>
                )}
                </div>
            </div>
            {renderContent()}
        </div>
        <div className="lg:col-span-1 space-y-6">
            <SummaryCard />
        </div>
      </div>
    </div>
  );
}
